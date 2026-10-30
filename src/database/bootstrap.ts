import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

interface RoleRow {
  organizationId: number
  roleId: number
}

const generatePassword = () => `OrgMind!${randomBytes(18).toString('base64url')}9a`

const bootstrap = async () => {
  const schemaSql = await readFile(path.resolve(process.cwd(), 'schema.sql'), 'utf8')
  const password = generatePassword()
  const passwordHash = await bcrypt.hash(password, 12)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(schemaSql)

    const existing = await client.query<{ id: number }>(
      `SELECT id::int FROM orgmind.app_user
       WHERE lower(username) = lower($1) OR lower(email) = lower($2)`,
      [env.SUPER_ADMIN_USERNAME, env.SUPER_ADMIN_EMAIL],
    )
    if (existing.rowCount) {
      throw new Error('Super Admin already exists; no password was changed.')
    }

    const role = await client.query<RoleRow>(`
      SELECT organization.id::int AS "organizationId", role.id::int AS "roleId"
      FROM orgmind.organization organization
      JOIN orgmind.role role ON role.organization_id = organization.id
      WHERE organization.id = $1 AND lower(role.name) = 'super admin'
        AND role.is_admin = true AND organization.active = true AND role.active = true
    `, [env.DEFAULT_ORGANIZATION_ID])
    const membership = role.rows[0]
    if (!membership) throw new Error('Default organization or Super Admin role was not initialized.')

    const user = await client.query<{ id: number }>(`
      INSERT INTO orgmind.app_user
        (organization_id, department_id, role_id, username, email, password_hash)
      VALUES ($1, NULL, $2, $3, $4, $5)
      RETURNING id::int
    `, [
      membership.organizationId,
      membership.roleId,
      env.SUPER_ADMIN_USERNAME,
      env.SUPER_ADMIN_EMAIL,
      passwordHash,
    ])
    const userId = user.rows[0]?.id
    if (!userId) throw new Error('Super Admin could not be created.')

    await client.query(
      'INSERT INTO orgmind.user_settings (user_id) VALUES ($1)',
      [userId],
    )
    await client.query('COMMIT')

    process.stdout.write(`${JSON.stringify({
      created: true,
      userId,
      username: env.SUPER_ADMIN_USERNAME,
      email: env.SUPER_ADMIN_EMAIL,
      password,
      role: 'Super Admin',
    }, null, 2)}\n`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

bootstrap()
  .catch(error => {
    logger.error('Database bootstrap failed', {
      message: error instanceof Error ? error.message : 'Unknown database error',
    })
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })

