import { readFileSync } from 'node:fs'
import pg from 'pg'
import type { PoolClient, QueryResultRow } from 'pg'
import { env } from './env.js'

const databaseUrl = new URL(env.DATABASE_URL)
const caCertificate = env.DATABASE_CA_CERT_PATH
  ? readFileSync(env.DATABASE_CA_CERT_PATH, 'utf8')
  : undefined
const useTls = Boolean(caCertificate) || databaseUrl.searchParams.has('sslmode') || env.NODE_ENV === 'production'

if (caCertificate) {
  // The explicit CA configuration provides verify-full semantics and avoids
  // pg replacing the SSL object with options parsed from the connection URL.
  databaseUrl.searchParams.delete('sslmode')
}

export const pool = new pg.Pool({
  connectionString: databaseUrl.toString(),
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 30_000,
  ssl: useTls
    ? {
        ca: caCertificate,
        rejectUnauthorized: caCertificate
          ? true
          : env.DATABASE_SSL_REJECT_UNAUTHORIZED,
      }
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

