import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { PoolClient } from 'pg'
import { query, withTransaction } from '../config/database.js'
import { env } from '../config/env.js'
import type { AuthTokenPayload, DatabaseUser } from '../types/auth.js'
import { ApiError } from '../utils/apiError.js'

type UserRow = DatabaseUser
interface RegisterInput {
  username: string
  email: string
  password: string
  departmentId: number
  roleId: number
  registrationToken?: string | undefined
}

const userSelect = `SELECT u.id::int, u.username, u.email, u.password_hash AS "passwordHash",
  u.organization_id::int AS "organizationId", u.department_id::int AS "departmentId",
  d.name AS "departmentName", r.id::int AS "roleId", r.name AS "roleName",
  r.is_admin AS "isAdmin", u.active
  FROM orgmind.app_user u
  JOIN orgmind.role r ON r.id = u.role_id AND r.organization_id = u.organization_id
  LEFT JOIN orgmind.department d ON d.id = u.department_id AND d.organization_id = u.organization_id`

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const toPayload = (user: DatabaseUser): AuthTokenPayload => ({
  userId: user.id, username: user.username, organizationId: user.organizationId,
  departmentId: user.departmentId, roleId: user.roleId, roleName: user.roleName, isAdmin: user.isAdmin,
})

const createSession = async (user: DatabaseUser, client?: PoolClient) => {
  const accessToken = jwt.sign(toPayload(user), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>, issuer: 'orgmind-ai', audience: 'orgmind-web',
  })
  const refreshToken = randomBytes(48).toString('base64url')
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 86_400_000)
  if (client) {
    await client.query('INSERT INTO orgmind.refresh_token (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [user.id, hashToken(refreshToken), expiresAt])
  } else {
    await query('INSERT INTO orgmind.refresh_token (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [user.id, hashToken(refreshToken), expiresAt])
  }
  return {
    userId: user.id, username: user.username, email: user.email,
    departmentName: user.departmentName, roleName: user.roleName,
    accessToken, token: accessToken, refreshToken, expiresIn: 3600, tokenType: 'Bearer',
    admin: user.isAdmin, isAdmin: user.isAdmin,
  }
}

export const authService = {
  async login(username: string, password: string) {
    const result = await query<UserRow>(`${userSelect} WHERE lower(u.username) = lower($1)`, [username])
    const user = result.rows[0]
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError(401, 'Invalid username or password.', 'INVALID_CREDENTIALS')
    }
    return createSession(user)
  },

  async register(input: RegisterInput) {
    const organizationId = env.DEFAULT_ORGANIZATION_ID
    return withTransaction(async client => {
      const duplicate = await client.query('SELECT 1 FROM orgmind.app_user WHERE lower(username) = lower($1) OR lower(email) = lower($2)', [input.username, input.email])
      if (duplicate.rowCount) throw new ApiError(409, 'Username or email is already registered.', 'USER_EXISTS')

      const membership = await client.query<{ departmentId: number | null; isAdmin: boolean }>(
        `SELECT r.department_id::int AS "departmentId", r.is_admin AS "isAdmin" FROM orgmind.department d
         JOIN orgmind.role r ON r.id = $2 AND r.organization_id = d.organization_id
         WHERE d.id = $1 AND d.organization_id = $3 AND d.active AND r.active`,
        [input.departmentId, input.roleId, organizationId],
      )
      const role = membership.rows[0]
      if (!role || (role.departmentId !== null && role.departmentId !== input.departmentId)) {
        throw new ApiError(400, 'The selected department and role are not compatible.', 'INVALID_MEMBERSHIP')
      }

      let hasValidRegistrationToken = false
      if (input.registrationToken) {
        const tokenResult = await client.query<{ id: number }>(
          `SELECT id::int FROM orgmind.registration_token WHERE token_hash = $1 AND organization_id = $2
           AND used_at IS NULL AND expires_at > now() FOR UPDATE`,
          [hashToken(input.registrationToken), organizationId],
        )
        const registration = tokenResult.rows[0]
        if (!registration) throw new ApiError(400, 'Registration token is invalid or expired.', 'INVALID_REGISTRATION_TOKEN')
        await client.query('UPDATE orgmind.registration_token SET used_at = now() WHERE id = $1', [registration.id])
        hasValidRegistrationToken = true
      }
      if (role.isAdmin && !hasValidRegistrationToken) {
        throw new ApiError(403, 'An invitation token is required for administrator registration.', 'ADMIN_INVITATION_REQUIRED')
      }

      const created = await client.query<{ id: number }>(
        `INSERT INTO orgmind.app_user (organization_id, department_id, role_id, username, email, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::int`,
        [organizationId, input.departmentId, input.roleId, input.username, input.email, await bcrypt.hash(input.password, 12)],
      )
      const id = created.rows[0]?.id
      if (!id) throw new ApiError(500, 'User registration could not be completed.', 'REGISTRATION_FAILED')
      await client.query('INSERT INTO orgmind.user_settings (user_id) VALUES ($1)', [id])
      return { userId: id, username: input.username, email: input.email }
    })
  },

  async refresh(refreshToken: string) {
    return withTransaction(async client => {
      const result = await client.query<UserRow>(
        `${userSelect} JOIN orgmind.refresh_token rt ON rt.user_id = u.id
         WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > now() AND u.active FOR UPDATE OF rt`,
        [hashToken(refreshToken)],
      )
      const user = result.rows[0]
      if (!user) throw new ApiError(401, 'Refresh token is invalid or expired.', 'INVALID_REFRESH_TOKEN')
      await client.query('UPDATE orgmind.refresh_token SET revoked_at = now() WHERE token_hash = $1', [hashToken(refreshToken)])
      return createSession(user, client)
    })
  },

  async logout(userId: number) {
    await query('UPDATE orgmind.refresh_token SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId])
  },

  async resetPassword(username: string, newPassword: string) {
    const result = await query(
      'UPDATE orgmind.app_user SET password_hash = $1, updated_at = now() WHERE lower(username) = lower($2) AND active',
      [await bcrypt.hash(newPassword, 12), username],
    )
    if (!result.rowCount) throw new ApiError(404, 'User was not found.', 'USER_NOT_FOUND')
    await query(`UPDATE orgmind.refresh_token SET revoked_at = now() WHERE user_id =
      (SELECT id FROM orgmind.app_user WHERE lower(username) = lower($1)) AND revoked_at IS NULL`, [username])
  },
}

