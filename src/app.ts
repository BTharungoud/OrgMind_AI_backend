import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js'
import { requestContext } from './middleware/requestContext.middleware.js'
import { routes } from './routes/index.js'
import { ApiError } from './utils/apiError.js'

export const createApp = () => {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(requestContext)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new ApiError(403, 'This origin is not allowed by CORS.', 'CORS_FORBIDDEN'))
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Request-Id'],
    maxAge: 86_400,
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use(env.API_PREFIX, routes)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

export const app = createApp()

