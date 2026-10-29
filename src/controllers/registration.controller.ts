import type { Request, Response } from 'express'
import { registrationService } from '../services/registration.service.js'
import { successResponse } from '../utils/apiResponse.js'
import { positiveId } from '../utils/request.js'
import { ApiError } from '../utils/apiError.js'

export const registrationController = {
  async metadata(request: Request, response: Response) {
    const organizationId = positiveId(request.query.organizationId, 'organizationId')
    const departmentId = request.query.departmentId ? positiveId(request.query.departmentId, 'departmentId') : undefined
    response.json(successResponse('Registration metadata retrieved', await registrationService.metadata(organizationId, departmentId)))
  },
  async resolve(request: Request, response: Response) {
    const token = request.query.token
    if (typeof token !== 'string' || !token) throw new ApiError(400, 'token is required.', 'VALIDATION_ERROR')
    const departmentId = request.query.departmentId ? positiveId(request.query.departmentId, 'departmentId') : undefined
    response.json(successResponse('Registration token resolved', await registrationService.resolve(token, departmentId)))
  },
  async createDevToken(request: Request, response: Response) {
    const organizationId = positiveId(request.query.organizationId, 'organizationId')
    const ttlMinutes = request.query.ttlMinutes ? positiveId(request.query.ttlMinutes, 'ttlMinutes') : 60
    response.json(successResponse('Registration token created', await registrationService.createDevToken(organizationId, ttlMinutes)))
  },
}

