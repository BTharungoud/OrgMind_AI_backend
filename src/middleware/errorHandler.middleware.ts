import type { ErrorRequestHandler, RequestHandler } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { ApiError } from '../utils/apiError.js'
import { logger } from '../utils/logger.js'

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new ApiError(404, `Route ${request.method} ${request.path} was not found`, 'ROUTE_NOT_FOUND'))
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  void _next
  let statusCode = 500
  let message = 'An unexpected error occurred.'
  let code = 'INTERNAL_ERROR'
  let errors: unknown = null

  if (error instanceof ApiError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
    errors = error.errors
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = 'Request validation failed.'
    code = 'VALIDATION_ERROR'
    errors = error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
  } else if (error instanceof multer.MulterError) {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    message = error.message
    code = error.code
  }

  const metadata = {
    requestId: request.requestId,
    method: request.method,
    path: request.path,
    statusCode,
    code,
    error: error instanceof Error ? error.message : 'Unknown error',
  }
  if (statusCode >= 500) logger.error('Request failed', metadata)
  else logger.warn('Request failed', metadata)

  response.status(statusCode).json({ success: false, message, data: null, errors, code })
}

