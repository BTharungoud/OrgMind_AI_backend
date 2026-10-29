import pdf from 'pdf-parse'
import { query, withTransaction } from '../config/database.js'
import { env } from '../config/env.js'
import type { AuthTokenPayload } from '../types/auth.js'
import { ApiError } from '../utils/apiError.js'
import { chunkText } from './chunking.service.js'
import { geminiService } from './gemini.service.js'

interface UploadInput {
  originalname: string
  mimetype: string
  buffer: Buffer
}

const extractText = async (file: UploadInput) => {
  if (file.mimetype === 'application/pdf') {
    const result = await pdf(file.buffer)
    return result.text
  }
  return file.buffer.toString('utf8')
}

const toVector = (values: number[]) => `[${values.join(',')}]`

export const documentService = {
  async ingest(file: UploadInput, auth: AuthTokenPayload, sourceUrl?: string) {
    const document = (await query<{ id: number }>(
      `INSERT INTO orgmind.document
       (organization_id, department_id, uploaded_by, title, source_url, mime_type, embedding_model, embedding_dimensions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id::int`,
      [auth.organizationId, auth.departmentId, auth.userId, file.originalname, sourceUrl ?? null,
        file.mimetype, env.GEMINI_EMBEDDING_MODEL, env.EMBEDDING_DIMENSIONS],
    )).rows[0]
    if (!document) throw new ApiError(500, 'Document could not be created.', 'DOCUMENT_CREATE_FAILED')

    try {
      const chunks = chunkText(await extractText(file))
      if (!chunks.length) throw new ApiError(400, 'The document contains no readable text.', 'EMPTY_DOCUMENT')
      const embedded: Array<{ index: number; content: string; embedding: number[] }> = []
      for (const chunk of chunks) {
        embedded.push({ ...chunk, embedding: await geminiService.embed(chunk.content) })
      }
      await withTransaction(async client => {
        for (const chunk of embedded) {
          await client.query(
            `INSERT INTO orgmind.document_chunk
             (document_id, organization_id, department_id, chunk_index, content, embedding)
             VALUES ($1, $2, $3, $4, $5, $6::vector)`,
            [document.id, auth.organizationId, auth.departmentId, chunk.index, chunk.content, toVector(chunk.embedding)],
          )
        }
        await client.query(`UPDATE orgmind.document SET status = 'INDEXED', updated_at = now() WHERE id = $1`, [document.id])
      })
      return { documentId: document.id, fileName: file.originalname, chunks: chunks.length, status: 'INDEXED' }
    } catch (error) {
      await query(`UPDATE orgmind.document SET status = 'FAILED', updated_at = now() WHERE id = $1`, [document.id])
      throw error
    }
  },

  async ingestFromUrl(url: string, auth: AuthTokenPayload) {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(parsed.hostname)) {
      throw new ApiError(400, 'The URL is not allowed.', 'INVALID_SOURCE_URL')
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    try {
      const response = await fetch(parsed, { signal: controller.signal, redirect: 'error' })
      if (!response.ok) throw new ApiError(400, 'The source URL could not be downloaded.', 'SOURCE_DOWNLOAD_FAILED')
      const contentLength = Number(response.headers.get('content-length') ?? '0')
      if (contentLength > env.MAX_UPLOAD_BYTES) throw new ApiError(413, 'The source file is too large.', 'FILE_TOO_LARGE')
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length > env.MAX_UPLOAD_BYTES) throw new ApiError(413, 'The source file is too large.', 'FILE_TOO_LARGE')
      const mimeType = response.headers.get('content-type')?.split(';')[0] || 'text/plain'
      return this.ingest({ originalname: parsed.pathname.split('/').pop() || 'remote-document', mimetype: mimeType, buffer }, auth, url)
    } finally {
      clearTimeout(timer)
    }
  },
}

