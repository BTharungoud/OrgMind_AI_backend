import type { Request, Response } from 'express'
import { query } from '../config/database.js'

export const healthController = {
  live(_request: Request, response: Response) {
    response.json({ status: 'UP' })
  },
  async ready(_request: Request, response: Response) {
    try {
      await query('SELECT 1')
      response.json({ status: 'UP', database: 'UP' })
    } catch {
      response.status(503).json({ status: 'DOWN', database: 'DOWN' })
    }
  },
}

