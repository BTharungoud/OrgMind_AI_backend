import { Router } from 'express'
import { aiController, historyController } from '../controllers/chat.controller.js'
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js'
import { aiRateLimit, ingestionRateLimit } from '../middleware/rateLimit.middleware.js'
import { upload } from '../middleware/upload.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const aiRouter = Router()
aiRouter.use(requireAuth)
aiRouter.post('/generate', aiRateLimit, asyncHandler(aiController.generate))
aiRouter.get('/generate', aiRateLimit, asyncHandler(aiController.legacy))
aiRouter.get('/check-ingestion', aiRateLimit, asyncHandler(aiController.checkIngestion))
aiRouter.post('/admin/ingest', requireAdmin, ingestionRateLimit, upload.single('file'), asyncHandler(aiController.ingestOne))
aiRouter.post('/admin/ingest-multiple', requireAdmin, ingestionRateLimit, upload.array('files', 10), asyncHandler(aiController.ingestMany))
aiRouter.post('/admin/ingest-from-url', requireAdmin, ingestionRateLimit, asyncHandler(aiController.ingestUrl))

export const historyRouter = Router()
historyRouter.use(requireAuth)
historyRouter.get('/user/:userId/category/:category', asyncHandler(historyController.byCategory))
historyRouter.get('/user/:userId', asyncHandler(historyController.byUser))
historyRouter.delete('/user/:userId', asyncHandler(historyController.removeByUser))
historyRouter.get('/:id', asyncHandler(historyController.get))
historyRouter.post('/', asyncHandler(historyController.save))
historyRouter.put('/:id', asyncHandler(historyController.update))
historyRouter.delete('/:id', asyncHandler(historyController.remove))

