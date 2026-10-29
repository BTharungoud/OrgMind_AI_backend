import { Router } from 'express'
import { registrationController } from '../controllers/registration.controller.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const registrationRouter = Router()
registrationRouter.get('/metadata', asyncHandler(registrationController.metadata))
registrationRouter.get('/resolve', asyncHandler(registrationController.resolve))
registrationRouter.get('/dev/create-token', asyncHandler(registrationController.createDevToken))

