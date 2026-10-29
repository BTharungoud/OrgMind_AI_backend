import { Router } from 'express'
import { organizationController, settingsController, userController } from '../controllers/management.controller.js'
import { requireAdmin, requireAuth, requireSuperAdmin } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const organizationRouter = Router()
organizationRouter.use(requireAuth, requireSuperAdmin)
organizationRouter.get('/', asyncHandler(organizationController.list))
organizationRouter.post('/', asyncHandler(organizationController.create))
organizationRouter.get('/:id', asyncHandler(organizationController.get))
organizationRouter.put('/:id', asyncHandler(organizationController.update))
organizationRouter.delete('/:id', asyncHandler(organizationController.remove))
organizationRouter.put('/:id/activate', asyncHandler(organizationController.activate))
organizationRouter.put('/:id/deactivate', asyncHandler(organizationController.deactivate))

export const userRouter = Router()
userRouter.use(requireAuth, requireAdmin)
userRouter.put('/:id/role', asyncHandler(userController.assignRole))
userRouter.put('/:id/activate', asyncHandler(userController.activate))
userRouter.put('/:id/deactivate', asyncHandler(userController.deactivate))

export const settingsRouter = Router()
settingsRouter.use(requireAuth)
settingsRouter.get('/:userId', asyncHandler(settingsController.get))
settingsRouter.put('/:userId', asyncHandler(settingsController.update))
settingsRouter.put('/:userId/dark-mode', asyncHandler(settingsController.toggle))
settingsRouter.put('/:userId/sidebar-position', asyncHandler(settingsController.sidebar))

