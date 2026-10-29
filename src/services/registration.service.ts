import { createHash, randomBytes } from 'node:crypto'
import { query } from '../config/database.js'
import { env } from '../config/env.js'
import { departmentService, roleService } from './catalog.service.js'
import { ApiError } from '../utils/apiError.js'

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

export const registrationService = {
  async metadata(organizationId: number, departmentId?: number) {
    const organization = (await query<{ id: number; name: string }>(
      'SELECT id::int, name FROM orgmind.organization WHERE id = $1 AND active', [organizationId],
    )).rows[0]
    if (!organization) throw new ApiError(404, 'Organization was not found.', 'ORGANIZATION_NOT_FOUND')
    return {
      organization,
      departments: await departmentService.list(organizationId),
      roles: await roleService.list(organizationId, departmentId),
    }
  },
  async resolve(token: string, departmentId?: number) {
    const row = (await query<{ organizationId: number }>(
      `SELECT organization_id::int AS "organizationId" FROM orgmind.registration_token
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`, [tokenHash(token)],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Registration token is invalid or expired.', 'INVALID_REGISTRATION_TOKEN')
    return this.metadata(row.organizationId, departmentId)
  },
  async createDevToken(organizationId: number, ttlMinutes: number) {
    if (!env.ENABLE_DEV_REGISTRATION_TOKENS || env.NODE_ENV === 'production') {
      throw new ApiError(404, 'Development registration tokens are disabled.', 'ROUTE_NOT_FOUND')
    }
    const token = randomBytes(32).toString('base64url')
    await query(
      `INSERT INTO orgmind.registration_token (organization_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 * interval '1 minute'))`,
      [organizationId, tokenHash(token), ttlMinutes],
    )
    return { token, organizationId, ttlMinutes }
  },
}

