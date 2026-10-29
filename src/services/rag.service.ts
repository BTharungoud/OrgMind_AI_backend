import { query } from '../config/database.js'
import { DEFAULT_CATEGORY } from '../config/constants.js'
import { env } from '../config/env.js'
import type { AuthTokenPayload } from '../types/auth.js'
import { geminiService } from './gemini.service.js'

interface RetrievedChunk {
  id: number
  documentId: number
  title: string
  content: string
  pageNumber: number | null
  distance: number
}

const vector = (values: number[]) => `[${values.join(',')}]`

export const ragService = {
  async generate(message: string, agentSelected: string, category: string, auth: AuthTokenPayload) {
    const embedding = await geminiService.embed(message)
    const departmentNames = category === DEFAULT_CATEGORY
      ? []
      : category.split(',').map(item => item.trim()).filter(Boolean)
    const chunks = (await query<RetrievedChunk>(
      `SELECT c.id::int, c.document_id::int AS "documentId", d.title, c.content,
              c.page_number::int AS "pageNumber", (c.embedding <=> $1::vector)::float AS distance
         FROM orgmind.document_chunk c
         JOIN orgmind.document d ON d.id = c.document_id AND d.organization_id = c.organization_id
         LEFT JOIN orgmind.department dep ON dep.id = c.department_id
        WHERE c.organization_id = $2 AND d.status = 'INDEXED'
          AND ($3::boolean OR c.department_id = $4 OR c.department_id IS NULL)
          AND (cardinality($5::text[]) = 0 OR dep.name = ANY($5::text[]))
        ORDER BY c.embedding <=> $1::vector LIMIT $6`,
      [vector(embedding), auth.organizationId, auth.roleName.toLowerCase() === 'super admin', auth.departmentId, departmentNames, env.RETRIEVAL_LIMIT],
    )).rows

    if (!chunks.length) {
      return { answer: 'The available indexed documents do not provide enough information to answer that question.', citations: [] }
    }
    const generated = await geminiService.answer(message, chunks)
    const selectedIds = new Set(generated.citation_ids)
    const citations = chunks.filter(chunk => selectedIds.has(chunk.id)).map(chunk => ({
      document_id: chunk.documentId,
      source_title: chunk.title,
      page_number: chunk.pageNumber,
      matched_text: chunk.content,
      distance: chunk.distance,
    }))
    return { answer: generated.answer, citations, agentSelected }
  },
}

