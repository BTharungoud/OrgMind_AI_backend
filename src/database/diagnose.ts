import { pool } from '../config/database.js'
import { logger } from '../utils/logger.js'

const diagnose = async () => {
  const [documentStatus, documents, history] = await Promise.all([
    pool.query<{ status: string; count: number }>(`
      SELECT status, count(*)::int AS count
      FROM orgmind.document
      GROUP BY status
      ORDER BY status
    `),
    pool.query<{
      id: number
      title: string
      status: string
      departmentId: number | null
      chunks: number
    }>(`
      SELECT document.id::int, document.title, document.status,
             document.department_id::int AS "departmentId",
             count(chunk.id)::int AS chunks
      FROM orgmind.document document
      LEFT JOIN orgmind.document_chunk chunk ON chunk.document_id = document.id
      GROUP BY document.id
      ORDER BY document.id DESC
      LIMIT 20
    `),
    pool.query<{
      id: number
      userId: number
      category: string
      queryLength: number
      responseLength: number
      createdAt: Date
    }>(`
      SELECT id::int, user_id::int AS "userId", category,
             length(query)::int AS "queryLength",
             length(response)::int AS "responseLength",
             created_at AS "createdAt"
      FROM orgmind.chat_history
      ORDER BY created_at DESC
      LIMIT 20
    `),
  ])

  process.stdout.write(`${JSON.stringify({
    documentStatus: documentStatus.rows,
    documents: documents.rows,
    history: history.rows,
  }, null, 2)}\n`)
}

diagnose()
  .catch(error => {
    logger.error('Database diagnostics failed', {
      message: error instanceof Error ? error.message : 'Unknown database error',
    })
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })

