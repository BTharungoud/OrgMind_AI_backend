import { Router } from 'express'
import { ingestionRequestController } from '../controllers/ingestionRequest.controller.js'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js'
import { ingestionRateLimit } from '../middleware/rateLimit.middleware.js'
import { upload } from '../middleware/upload.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const ingestionRequestRouter = Router()
ingestionRequestRouter.use(requireAuth)
ingestionRequestRouter.get('/mine', asyncHandler(ingestionRequestController.mine))
ingestionRequestRouter.post('/approve', requireAdmin, ingestionRateLimit, asyncHandler(ingestionRequestController.approve))
ingestionRequestRouter.post('/', ingestionRateLimit, upload.single('file'), asyncHandler(ingestionRequestController.submit))
ingestionRequestRouter.get('/', requireAdmin, asyncHandler(ingestionRequestController.list))

