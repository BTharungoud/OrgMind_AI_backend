import { createServer } from 'node:http'
import { app } from './app.js'
import { pool } from './config/database.js'
import { env } from './config/env.js'
import { logger } from './utils/logger.js'

const server = createServer(app)
server.requestTimeout = 120_000
server.headersTimeout = 65_000

server.listen(env.PORT, () => {
  logger.info('OrgMind AI backend started', { port: env.PORT, environment: env.NODE_ENV })
})

let shuttingDown = false
const shutdown = (signal: string) => {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('Graceful shutdown started', { signal })
  const forced = setTimeout(() => process.exit(1), 15_000)
  forced.unref()
  server.close(error => {
    void (async () => {
      if (error) logger.error('HTTP server shutdown failed', { message: error.message })
      await pool.end()
      clearTimeout(forced)
      process.exit(error ? 1 : 0)
    })()
  })
}

process.on('SIGTERM', () => { shutdown('SIGTERM') })
process.on('SIGINT', () => { shutdown('SIGINT') })

process.on('unhandledRejection', reason => {
  logger.error('Unhandled rejection', { reason: reason instanceof Error ? reason.message : String(reason) })
})

process.on('uncaughtException', error => {
  logger.error('Uncaught exception', { message: error.message })
  shutdown('uncaughtException')
})

