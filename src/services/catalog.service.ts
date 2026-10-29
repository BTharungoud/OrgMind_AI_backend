import { query } from '../config/database.js'
import { ApiError } from '../utils/apiError.js'

export interface CatalogPayload {
  name: string
  description?: string | undefined
}

export const departmentService = {
  async list(organizationId: number) {
    return (await query(
      `SELECT id::int, name, description FROM orgmind.department
       WHERE organization_id = $1 AND active ORDER BY name`, [organizationId],
    )).rows
  },
  async get(id: number, organizationId: number) {
    const row = (await query(
      `SELECT id::int, name, description FROM orgmind.department
       WHERE id = $1 AND organization_id = $2`, [id, organizationId],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Department was not found.', 'DEPARTMENT_NOT_FOUND')
    return row
  },
  async create(organizationId: number, payload: CatalogPayload) {
    const row = (await query(
      `INSERT INTO orgmind.department (organization_id, name, description)
       VALUES ($1, $2, $3) RETURNING id::int, name, description`,
      [organizationId, payload.name, payload.description ?? null],
    )).rows[0]
    return row
  },
  async update(id: number, organizationId: number, payload: CatalogPayload) {
    const row = (await query(
      `UPDATE orgmind.department SET name = $3, description = $4, updated_at = now()
       WHERE id = $1 AND organization_id = $2 RETURNING id::int, name, description`,
      [id, organizationId, payload.name, payload.description ?? null],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Department was not found.', 'DEPARTMENT_NOT_FOUND')
    return row
  },
  async remove(id: number, organizationId: number) {
    const result = await query(
      `UPDATE orgmind.department SET active = false, updated_at = now()
       WHERE id = $1 AND organization_id = $2`, [id, organizationId],
    )
    if (!result.rowCount) throw new ApiError(404, 'Department was not found.', 'DEPARTMENT_NOT_FOUND')
  },
}

export interface RolePayload extends CatalogPayload {
  departmentId?: number | undefined
  isAdmin?: boolean | undefined
}

export const roleService = {
  async list(organizationId: number, departmentId?: number) {
    const values: unknown[] = [organizationId]
    const departmentFilter = departmentId
      ? 'AND (department_id = $2 OR department_id IS NULL)'
      : ''
    if (departmentId) values.push(departmentId)
    return (await query(
      `SELECT id::int, name, description, department_id::int AS "departmentId", is_admin AS "isAdmin"
       FROM orgmind.role WHERE organization_id = $1 AND active ${departmentFilter} ORDER BY name`, values,
    )).rows
  },
  async get(id: number, organizationId: number) {
    const row = (await query(
      `SELECT id::int, name, description, department_id::int AS "departmentId", is_admin AS "isAdmin"
       FROM orgmind.role WHERE id = $1 AND organization_id = $2`, [id, organizationId],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Role was not found.', 'ROLE_NOT_FOUND')
    return row
  },
  async create(organizationId: number, payload: RolePayload) {
    if (payload.departmentId) await departmentService.get(payload.departmentId, organizationId)
    return (await query(
      `INSERT INTO orgmind.role (organization_id, department_id, name, description, is_admin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id::int, name, description, department_id::int AS "departmentId", is_admin AS "isAdmin"`,
      [organizationId, payload.departmentId ?? null, payload.name, payload.description ?? null, payload.isAdmin ?? false],
    )).rows[0]
  },
  async update(id: number, organizationId: number, payload: RolePayload) {
    if (payload.departmentId) await departmentService.get(payload.departmentId, organizationId)
    const row = (await query(
      `UPDATE orgmind.role SET name = $3, description = $4,
          department_id = COALESCE($5, department_id), is_admin = COALESCE($6, is_admin), updated_at = now()
       WHERE id = $1 AND organization_id = $2
       RETURNING id::int, name, description, department_id::int AS "departmentId", is_admin AS "isAdmin"`,
      [id, organizationId, payload.name, payload.description ?? null, payload.departmentId ?? null, payload.isAdmin ?? null],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Role was not found.', 'ROLE_NOT_FOUND')
    return row
  },
  async remove(id: number, organizationId: number) {
    const result = await query('UPDATE orgmind.role SET active = false, updated_at = now() WHERE id = $1 AND organization_id = $2', [id, organizationId])
    if (!result.rowCount) throw new ApiError(404, 'Role was not found.', 'ROLE_NOT_FOUND')
  },
}

