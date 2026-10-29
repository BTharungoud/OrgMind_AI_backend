import type { Request, Response } from 'express'
import { organizationService, settingsService, userManagementService } from '../services/management.service.js'
import { successResponse } from '../utils/apiResponse.js'
import { positiveId, requireRequestAuth, stringField } from '../utils/request.js'
import { ApiError } from '../utils/apiError.js'

export const organizationController = {
  async list(request: Request, response: Response) {
    response.json(await organizationService.list(requireRequestAuth(request)))
  },
  async create(request: Request, response: Response) {
    const body = request.body as Record<string, unknown>
    response.status(201).json(successResponse('Organization created', await organizationService.create(
      stringField(body.name, 'name'), typeof body.description === 'string' ? body.description : undefined,
    )))
  },
  async get(request: Request, response: Response) {
    response.json(await organizationService.get(positiveId(request.params.id), requireRequestAuth(request)))
  },
  async update(request: Request, response: Response) {
    const body = request.body as Record<string, unknown>
    response.json(successResponse('Organization updated', await organizationService.update(
      positiveId(request.params.id), requireRequestAuth(request), stringField(body.name, 'name'),
      typeof body.description === 'string' ? body.description : undefined,
    )))
  },
  async remove(request: Request, response: Response) {
    response.json(successResponse('Organization deleted', await organizationService.remove(
      positiveId(request.params.id), requireRequestAuth(request),
    )))
  },
  async activate(request: Request, response: Response) {
    response.json(successResponse('Organization activated', await organizationService.setActive(positiveId(request.params.id), requireRequestAuth(request), true)))
  },
  async deactivate(request: Request, response: Response) {
    response.json(successResponse('Organization deactivated', await organizationService.setActive(positiveId(request.params.id), requireRequestAuth(request), false)))
  },
}

export const userController = {
  async assignRole(request: Request, response: Response) {
    const roleId = positiveId(request.query.roleId, 'roleId')
    await userManagementService.assignRole(positiveId(request.params.id), roleId, requireRequestAuth(request))
    response.json(successResponse('Role assigned', null))
  },
  async activate(request: Request, response: Response) {
    await userManagementService.setActive(positiveId(request.params.id), requireRequestAuth(request), true)
    response.json(successResponse('User activated', null))
  },
  async deactivate(request: Request, response: Response) {
    await userManagementService.setActive(positiveId(request.params.id), requireRequestAuth(request), false)
    response.json(successResponse('User deactivated', null))
  },
}

export const settingsController = {
  async get(request: Request, response: Response) {
    response.json(await settingsService.get(positiveId(request.params.userId, 'userId'), requireRequestAuth(request)))
  },
  async update(request: Request, response: Response) {
    const body = request.body as { darkMode?: unknown; sidebarPosition?: unknown }
    if (body.darkMode !== undefined && typeof body.darkMode !== 'boolean') throw new ApiError(400, 'darkMode must be boolean.', 'VALIDATION_ERROR')
    if (body.sidebarPosition !== undefined && body.sidebarPosition !== 'left' && body.sidebarPosition !== 'right') {
      throw new ApiError(400, 'sidebarPosition must be left or right.', 'VALIDATION_ERROR')
    }
    response.json(await settingsService.update(
      positiveId(request.params.userId, 'userId'), requireRequestAuth(request),
      body.darkMode, body.sidebarPosition,
    ))
  },
  async toggle(request: Request, response: Response) {
    response.json(await settingsService.toggleDarkMode(positiveId(request.params.userId, 'userId'), requireRequestAuth(request)))
  },
  async sidebar(request: Request, response: Response) {
    const position = request.query.position
    if (position !== 'left' && position !== 'right') throw new ApiError(400, 'position must be left or right.', 'VALIDATION_ERROR')
    response.json(await settingsService.update(positiveId(request.params.userId, 'userId'), requireRequestAuth(request), undefined, position))
  },
}

