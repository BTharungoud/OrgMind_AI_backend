import { query } from '../config/database.js'
import type { AuthTokenPayload } from '../types/auth.js'
import { ApiError } from '../utils/apiError.js'
import { ragService } from './rag.service.js'

export interface HistoryInput {
  userId: number
  query: string
  response: string
  agentSelected: string
  uploadedFiles?: string | undefined
  category: string
  citations?: unknown[] | undefined
}

const historySelect = `SELECT id::int, user_id::int AS "userId", query, response,
  agent_selected AS "agentSelected", uploaded_files AS "uploadedFiles", category, citations,
  created_at AS "createdAt", updated_at AS "updatedAt" FROM orgmind.chat_history`

const authorizeUser = (requestedUserId: number, auth: AuthTokenPayload) => {
  if (requestedUserId !== auth.userId && !auth.isAdmin) {
    throw new ApiError(403, 'Chat history belongs to another user.', 'FORBIDDEN')
  }
}

export const chatService = {
  async generate(message: string, agentSelected: string, category: string, auth: AuthTokenPayload, userId: number) {
    authorizeUser(userId, auth)
    const generated = await ragService.generate(message, agentSelected, category, auth)
    const history = await this.save({
      userId, query: message, response: generated.answer, agentSelected,
      category, citations: generated.citations,
    }, auth)
    return { ...generated, historyId: history.id }
  },
  async listByUser(userId: number, auth: AuthTokenPayload, category?: string) {
    authorizeUser(userId, auth)
    const values: unknown[] = [userId, auth.organizationId]
    const filter = category ? 'AND category = $3' : ''
    if (category) values.push(category)
    return (await query(
      `${historySelect} WHERE user_id = $1 AND organization_id = $2 ${filter} ORDER BY created_at DESC`, values,
    )).rows
  },
  async get(id: number, auth: AuthTokenPayload) {
    const row = (await query(
      `${historySelect} WHERE id = $1 AND organization_id = $2
       AND ($3::boolean OR user_id = $4)`, [id, auth.organizationId, auth.isAdmin, auth.userId],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Chat history was not found.', 'CHAT_NOT_FOUND')
    return row
  },
  async save(input: HistoryInput, auth: AuthTokenPayload) {
    authorizeUser(input.userId, auth)
    const row = (await query<{ id: number }>(
      `INSERT INTO orgmind.chat_history
       (organization_id, department_id, user_id, query, response, agent_selected, uploaded_files, category, citations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb) RETURNING id::int`,
      [auth.organizationId, auth.departmentId, input.userId, input.query, input.response,
        input.agentSelected, input.uploadedFiles ?? null, input.category, JSON.stringify(input.citations ?? [])],
    )).rows[0]
    if (!row) throw new ApiError(500, 'Chat history could not be saved.', 'CHAT_SAVE_FAILED')
    return row
  },
  async update(id: number, responseText: string | undefined, category: string | undefined, auth: AuthTokenPayload) {
    const row = (await query(
      `UPDATE orgmind.chat_history SET response = COALESCE($4, response), category = COALESCE($5, category), updated_at = now()
       WHERE id = $1 AND organization_id = $2 AND ($3::boolean OR user_id = $6)
       RETURNING id::int, response, category, updated_at AS "updatedAt"`,
      [id, auth.organizationId, auth.isAdmin, responseText ?? null, category ?? null, auth.userId],
    )).rows[0]
    if (!row) throw new ApiError(404, 'Chat history was not found.', 'CHAT_NOT_FOUND')
    return row
  },
  async remove(id: number, auth: AuthTokenPayload) {
    const result = await query(
      'DELETE FROM orgmind.chat_history WHERE id = $1 AND organization_id = $2 AND ($3::boolean OR user_id = $4)',
      [id, auth.organizationId, auth.isAdmin, auth.userId],
    )
    if (!result.rowCount) throw new ApiError(404, 'Chat history was not found.', 'CHAT_NOT_FOUND')
  },
  async removeByUser(userId: number, auth: AuthTokenPayload) {
    authorizeUser(userId, auth)
    await query('DELETE FROM orgmind.chat_history WHERE user_id = $1 AND organization_id = $2', [userId, auth.organizationId])
  },
}

