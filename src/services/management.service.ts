import { query } from '../config/database.js'
import type { AuthTokenPayload } from '../types/auth.js'
import { ApiError } from '../utils/apiError.js'

export const organizationService = {
  async list(auth: AuthTokenPayload) {
    return (await query(
      `SELECT id::int, name, description, active FROM orgmind.organization
       WHERE id = $1 ORDER BY name`, [auth.organizationId],
    )).rows
  },
  async create(name: string, description?: string) {
    return (await query(
      `INSERT INTO orgmind.organization (name, description) VALUES ($1, $2)
       RETURNING id::int, name, description, active`, [name, description ?? null],
    )).rows[0]
  },
  async get(id: number, auth: AuthTokenPayload) {
    if (id !== auth.organizationId) throw new ApiError(403, 'Cross-organization access is forbidden.', 'FORBIDDEN')
    const row = (await query(
      'SELECT id::int, name, description, active FROM orgmind.organization WHERE id = $1', [id],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Organization was not found.', 'ORGANIZATION_NOT_FOUND')
    return row
  },
  async update(id: number, auth: AuthTokenPayload, name: string, description?: string) {
    if (id !== auth.organizationId) throw new ApiError(403, 'Cross-organization access is forbidden.', 'FORBIDDEN')
    const row = (await query(
      `UPDATE orgmind.organization SET name = $2, description = $3, updated_at = now()
       WHERE id = $1 RETURNING id::int, name, description, active`, [id, name, description ?? null],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Organization was not found.', 'ORGANIZATION_NOT_FOUND')
    return row
  },
  async remove(id: number, auth: AuthTokenPayload) {
    return this.setActive(id, auth, false)
  },
  async setActive(id: number, auth: AuthTokenPayload, active: boolean) {
    if (id !== auth.organizationId) throw new ApiError(403, 'Cross-organization access is forbidden.', 'FORBIDDEN')
    const row = (await query(
      `UPDATE orgmind.organization SET active = $2, updated_at = now() WHERE id = $1
       RETURNING id::int, name, description, active`, [id, active],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Organization was not found.', 'ORGANIZATION_NOT_FOUND')
    return row
  },
}

export const userManagementService = {
  async assignRole(userId: number, roleId: number, auth: AuthTokenPayload) {
    const role = (await query<{ departmentId: number | null; roleName: string }>(
      `SELECT department_id::int AS "departmentId", name AS "roleName" FROM orgmind.role
       WHERE id = $1 AND organization_id = $2 AND active`, [roleId, auth.organizationId],
    )).rows[0]
    if (!role) throw new ApiError(404, 'Role was not found.', 'ROLE_NOT_FOUND')
    const superAdmin = auth.roleName.toLowerCase() === 'super admin'
    if (!superAdmin && (role.departmentId === null || role.departmentId !== auth.departmentId)) {
      throw new ApiError(403, 'Department administrators can assign only roles from their department.', 'FORBIDDEN')
    }
    const result = await query(
      `UPDATE orgmind.app_user SET role_id = $3, updated_at = now()
       WHERE id = $1 AND organization_id = $2
         AND ($4::boolean OR department_id = $5)
         AND ($6::bigint IS NULL OR department_id = $6)`,
      [userId, auth.organizationId, roleId, superAdmin, auth.departmentId, role.departmentId],
    )
    if (!result.rowCount) throw new ApiError(404, 'User was not found or role is incompatible.', 'USER_NOT_FOUND')
  },
  async setActive(userId: number, auth: AuthTokenPayload, active: boolean) {
    if (userId === auth.userId && !active) throw new ApiError(400, 'You cannot deactivate your own account.', 'SELF_DEACTIVATION')
    const result = await query(
      `UPDATE orgmind.app_user SET active = $3, updated_at = now()
       WHERE id = $1 AND organization_id = $2
       AND ($4::boolean OR department_id = $5)`,
      [userId, auth.organizationId, active, auth.roleName.toLowerCase() === 'super admin', auth.departmentId],
    )
    if (!result.rowCount) throw new ApiError(404, 'User was not found.', 'USER_NOT_FOUND')
  },
}

export const settingsService = {
  async ensureOwner(userId: number, auth: AuthTokenPayload) {
    if (userId === auth.userId) return
    if (!auth.isAdmin) throw new ApiError(403, 'You cannot access another user settings.', 'FORBIDDEN')
    const exists = await query('SELECT 1 FROM orgmind.app_user WHERE id = $1 AND organization_id = $2', [userId, auth.organizationId])
    if (!exists.rowCount) throw new ApiError(404, 'User was not found.', 'USER_NOT_FOUND')
  },
  async get(userId: number, auth: AuthTokenPayload) {
    await this.ensureOwner(userId, auth)
    const row = (await query(
      `INSERT INTO orgmind.user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING user_id::int AS "userId", dark_mode AS "darkMode", sidebar_position AS "sidebarPosition"`, [userId],
    )).rows[0]
    return row
  },
  async update(userId: number, auth: AuthTokenPayload, darkMode?: boolean, sidebarPosition?: 'left' | 'right') {
    await this.ensureOwner(userId, auth)
    await this.get(userId, auth)
    return (await query(
      `UPDATE orgmind.user_settings SET dark_mode = COALESCE($2, dark_mode),
       sidebar_position = COALESCE($3, sidebar_position), updated_at = now()
       WHERE user_id = $1 RETURNING user_id::int AS "userId", dark_mode AS "darkMode", sidebar_position AS "sidebarPosition"`,
      [userId, darkMode ?? null, sidebarPosition ?? null],
    )).rows[0]
  },
  async toggleDarkMode(userId: number, auth: AuthTokenPayload) {
    await this.ensureOwner(userId, auth)
    await this.get(userId, auth)
    return (await query(
      `UPDATE orgmind.user_settings SET dark_mode = NOT dark_mode, updated_at = now() WHERE user_id = $1
       RETURNING user_id::int AS "userId", dark_mode AS "darkMode", sidebar_position AS "sidebarPosition"`, [userId],
    )).rows[0]
  },
}

