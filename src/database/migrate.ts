import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../config/database.js'
import { logger } from '../utils/logger.js'

const run = async () => {
  const migrationsDirectory = path.resolve(process.cwd(), 'migrations')
  const files = (await readdir(migrationsDirectory))
    .filter(file => file.endsWith('.sql'))
    .sort()

  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.orgmind_schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    for (const file of files) {
      const exists = await client.query<{ exists: boolean }>(
        'SELECT EXISTS (SELECT 1 FROM public.orgmind_schema_migrations WHERE name = $1) AS exists',
        [file],
      )
      if (exists.rows[0]?.exists) continue

      const sql = await readFile(path.join(migrationsDirectory, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO public.orgmind_schema_migrations (name) VALUES ($1)',
          [file],
        )
        await client.query('COMMIT')
        logger.info('Migration applied', { migration: file })
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(error => {
  logger.error('Migration failed', {
    message: error instanceof Error ? error.message : 'Unknown migration error',
  })
  process.exitCode = 1
})

