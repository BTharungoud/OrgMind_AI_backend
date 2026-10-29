import type { Request } from 'express'
import type { AuthTokenPayload } from '../types/auth.js'
import { ApiError } from './apiError.js'

export const requireRequestAuth = (request: Request): AuthTokenPayload => {
  if (!request.auth) throw new ApiError(401, 'Authentication is required.', 'UNAUTHORIZED')
  return request.auth
}

export const positiveId = (value: unknown, label = 'id') => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new ApiError(400, `${label} must be a positive integer.`, 'VALIDATION_ERROR')
  }
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, `${label} must be a positive integer.`, 'VALIDATION_ERROR')
  }
  return id
}

export const stringField = (value: unknown, label: string, maximum = 150) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new ApiError(400, `${label} is required and must not exceed ${maximum} characters.`, 'VALIDATION_ERROR')
  }
  return value.trim()
}

