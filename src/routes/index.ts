import { Router } from 'express'
import { healthController } from '../controllers/health.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { aiRouter, historyRouter } from './chat.routes.js'
import { authRouter } from './auth.routes.js'
import { departmentRouter, roleRouter } from './catalog.routes.js'
import { ingestionRequestRouter } from './ingestionRequest.routes.js'
import { organizationRouter, settingsRouter, userRouter } from './management.routes.js'
import { registrationRouter } from './registration.routes.js'

export const routes = Router()

routes.get('/actuator/health', healthController.live)
routes.get('/health/live', healthController.live)
routes.get('/health/ready', asyncHandler(healthController.ready))
routes.use('/user', authRouter)
routes.use('/user', userRouter)
routes.use('/department', departmentRouter)
routes.use('/role', roleRouter)
routes.use('/organization', organizationRouter)
routes.use('/registration', registrationRouter)
routes.use('/ingestion-requests', ingestionRequestRouter)
routes.use('/ai', aiRouter)
routes.use('/chat-history', historyRouter)
routes.use('/settings', settingsRouter)

