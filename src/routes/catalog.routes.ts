import { Router } from 'express'
import { departmentController, roleController } from '../controllers/catalog.controller.js'
import { requireAuth, requireSuperAdmin } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const departmentRouter = Router()
departmentRouter.use(requireAuth)
departmentRouter.get('/', asyncHandler(departmentController.list))
departmentRouter.get('/:id', asyncHandler(departmentController.get))
departmentRouter.post('/', requireSuperAdmin, asyncHandler(departmentController.create))
departmentRouter.put('/:id', requireSuperAdmin, asyncHandler(departmentController.update))
departmentRouter.delete('/:id', requireSuperAdmin, asyncHandler(departmentController.remove))

export const roleRouter = Router()
roleRouter.use(requireAuth)
roleRouter.get('/', asyncHandler(roleController.list))
roleRouter.get('/department/:departmentId', asyncHandler(roleController.byDepartment))
roleRouter.get('/:id', asyncHandler(roleController.get))
roleRouter.post('/', requireSuperAdmin, asyncHandler(roleController.create))
roleRouter.put('/:id', requireSuperAdmin, asyncHandler(roleController.update))
roleRouter.delete('/:id', requireSuperAdmin, asyncHandler(roleController.remove))

