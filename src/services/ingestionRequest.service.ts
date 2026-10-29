import { query } from '../config/database.js'
import type { AuthTokenPayload } from '../types/auth.js'
import { ApiError } from '../utils/apiError.js'
import { documentService } from './document.service.js'

interface ReviewInput {
  requestId: number
  approve: boolean
  comment?: string | undefined
}

interface RequestFileRow {
  id: number
  organizationId: number
  departmentId: number | null
  requestedBy: number
  fileName: string
  mimeType: string
  fileContent: Buffer
}

const selectList = `SELECT id::int, department_id::int AS "departmentId",
  requested_by::int AS "requestedBy", file_name AS "fileName", mime_type AS "mimeType",
  status, review_comment AS "reviewComment", created_at AS "createdAt", reviewed_at AS "reviewedAt"
  FROM orgmind.ingestion_request`

export const ingestionRequestService = {
  async submit(file: Express.Multer.File, auth: AuthTokenPayload) {
    const row = (await query(
      `INSERT INTO orgmind.ingestion_request
       (organization_id, department_id, requested_by, file_name, mime_type, file_content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id::int, status, created_at AS "createdAt"`,
      [auth.organizationId, auth.departmentId, auth.userId, file.originalname, file.mimetype, file.buffer],
    )).rows[0]
    return row
  },
  async mine(auth: AuthTokenPayload) {
    return (await query(`${selectList} WHERE requested_by = $1 AND organization_id = $2 ORDER BY created_at DESC`, [auth.userId, auth.organizationId])).rows
  },
  async list(auth: AuthTokenPayload) {
    const superAdmin = auth.roleName.toLowerCase() === 'super admin'
    return (await query(
      `${selectList} WHERE organization_id = $1 AND ($2::boolean OR department_id = $3) ORDER BY created_at DESC`,
      [auth.organizationId, superAdmin, auth.departmentId],
    )).rows
  },
  async review(input: ReviewInput, auth: AuthTokenPayload) {
    const superAdmin = auth.roleName.toLowerCase() === 'super admin'
    const request = (await query<RequestFileRow>(
      `SELECT id::int, organization_id::int AS "organizationId", department_id::int AS "departmentId",
       requested_by::int AS "requestedBy", file_name AS "fileName", mime_type AS "mimeType", file_content AS "fileContent"
       FROM orgmind.ingestion_request WHERE id = $1 AND organization_id = $2 AND status = 'PENDING'
       AND ($3::boolean OR department_id = $4)`,
      [input.requestId, auth.organizationId, superAdmin, auth.departmentId],
    )).rows[0]
    if (!request) throw new ApiError(404, 'Pending ingestion request was not found.', 'INGESTION_REQUEST_NOT_FOUND')

    await query(
      `UPDATE orgmind.ingestion_request SET status = $2, reviewed_by = $3,
       review_comment = $4, reviewed_at = now() WHERE id = $1`,
      [input.requestId, input.approve ? 'APPROVED' : 'REJECTED', auth.userId, input.comment ?? null],
    )
    if (!input.approve) return { requestId: input.requestId, status: 'REJECTED' }

    try {
      const document = await documentService.ingest({
        originalname: request.fileName, mimetype: request.mimeType, buffer: request.fileContent,
      }, { ...auth, departmentId: request.departmentId })
      return { requestId: input.requestId, status: 'APPROVED', document }
    } catch (error) {
      await query(`UPDATE orgmind.ingestion_request SET status = 'FAILED' WHERE id = $1`, [input.requestId])
      throw error
    }
  },
}

