import { pool } from '../config/database.js'
import { logger } from '../utils/logger.js'

const inspect = async () => {
  const [database, extensions, tables, columns] = await Promise.all([
    pool.query<{ database: string; user: string; version: string }>(
      'SELECT current_database() AS database, current_user AS user, version() AS version',
    ),
    pool.query<{ extname: string; extversion: string }>(
      'SELECT extname, extversion FROM pg_extension ORDER BY extname',
    ),
    pool.query<{ schema: string; table: string }>(`
      SELECT namespace.nspname AS schema, relation.relname AS table
      FROM pg_class relation
      JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      WHERE relation.relkind = 'r'
        AND namespace.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 1, 2
    `),
    pool.query<{
      schema: string
      table: string
      column: string
      type: string
      nullable: string
    }>(`
      SELECT table_schema AS schema, table_name AS table,
             column_name AS column, data_type AS type, is_nullable AS nullable
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name, ordinal_position
    `),
  ])

  process.stdout.write(`${JSON.stringify({
    database: database.rows[0],
    extensions: extensions.rows,
    tables: tables.rows,
    columns: columns.rows,
  }, null, 2)}\n`)
}

inspect()
  .catch(error => {
    logger.error('Database inspection failed', {
      message: error instanceof Error ? error.message : 'Unknown database error',
    })
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })

