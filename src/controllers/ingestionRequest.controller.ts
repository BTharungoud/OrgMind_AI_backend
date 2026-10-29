import type { Request, Response } from 'express'
import { ingestionRequestService } from '../services/ingestionRequest.service.js'
import { ApiError } from '../utils/apiError.js'
import { successResponse } from '../utils/apiResponse.js'
import { positiveId, requireRequestAuth } from '../utils/request.js'

export const ingestionRequestController = {
  async submit(request: Request, response: Response) {
    if (!request.file) throw new ApiError(400, 'file is required.', 'VALIDATION_ERROR')
    response.status(201).json(successResponse('Ingestion request submitted', await ingestionRequestService.submit(request.file, requireRequestAuth(request))))
  },
  async mine(request: Request, response: Response) {
    response.json(await ingestionRequestService.mine(requireRequestAuth(request)))
  },
  async list(request: Request, response: Response) {
    response.json(await ingestionRequestService.list(requireRequestAuth(request)))
  },
  async approve(request: Request, response: Response) {
    const body = request.body as Record<string, unknown>
    if (typeof body.approve !== 'boolean') throw new ApiError(400, 'approve must be boolean.', 'VALIDATION_ERROR')
    response.json(successResponse('Ingestion request reviewed', await ingestionRequestService.review({
      requestId: positiveId(body.requestId, 'requestId'),
      approve: body.approve,
      comment: typeof body.comment === 'string' ? body.comment : undefined,
    }, requireRequestAuth(request))))
  },
}

