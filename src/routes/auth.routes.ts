import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { authRateLimit } from '../middleware/rateLimit.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema } from '../validation/auth.validation.js'

export const authRouter = Router()
authRouter.post('/login', authRateLimit, validate(loginSchema), asyncHandler(authController.login))
authRouter.post('/register', authRateLimit, validate(registerSchema), asyncHandler(authController.register))
authRouter.post('/refresh-token', authRateLimit, validate(refreshSchema), asyncHandler(authController.refresh))
authRouter.post('/logout', requireAuth, asyncHandler(authController.logout))
authRouter.post('/forgot-password', authRateLimit, requireAuth, validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword))

