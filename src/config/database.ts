import pg from 'pg'
import type { PoolClient, QueryResultRow } from 'pg'
import { env } from './env.js'

const useTls = env.DATABASE_URL.includes('sslmode=require') || env.NODE_ENV === 'production'

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 30_000,
  ssl: useTls
    ? { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED }
    : undefined,
})

export const query = <T extends QueryResultRow>(text: string, values: unknown[] = []) =>
  pool.query<T>(text, values)

export const withTransaction = async <T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

