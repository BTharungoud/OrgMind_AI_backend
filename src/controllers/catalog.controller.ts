import type { Request, Response } from 'express'
import { departmentService, roleService } from '../services/catalog.service.js'
import { successResponse } from '../utils/apiResponse.js'
import { positiveId, requireRequestAuth, stringField } from '../utils/request.js'

const catalogBody = (request: Request) => {
  const body = request.body as Record<string, unknown>
  return {
    name: stringField(body.name, 'name'),
    description: typeof body.description === 'string' ? body.description.trim() : undefined,
  }
}

export const departmentController = {
  async list(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    response.json(await departmentService.list(auth.organizationId))
  },
  async get(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    response.json(await departmentService.get(positiveId(request.params.id), auth.organizationId))
  },
  async create(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    response.status(201).json(successResponse('Department created', await departmentService.create(auth.organizationId, catalogBody(request))))
  },
  async update(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    response.json(successResponse('Department updated', await departmentService.update(positiveId(request.params.id), auth.organizationId, catalogBody(request))))
  },
  async remove(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    await departmentService.remove(positiveId(request.params.id), auth.organizationId)
    response.json(successResponse('Department deleted', null))
  },
}

const roleBody = (request: Request) => {
  const body = request.body as Record<string, unknown>
  return {
    ...catalogBody(request),
    departmentId: body.departmentId ? positiveId(body.departmentId, 'departmentId') : undefined,
    isAdmin: body.isAdmin === true || body.isAdmin === 'true',
  }
}

export const roleController = {
  async list(request: Request, response: Response) {
    response.json(await roleService.list(requireRequestAuth(request).organizationId))
  },
  async byDepartment(request: Request, response: Response) {
    response.json(await roleService.list(requireRequestAuth(request).organizationId, positiveId(request.params.departmentId, 'departmentId')))
  },
  async get(request: Request, response: Response) {
    response.json(await roleService.get(positiveId(request.params.id), requireRequestAuth(request).organizationId))
  },
  async create(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    response.status(201).json(successResponse('Role created', await roleService.create(auth.organizationId, roleBody(request))))
  },
  async update(request: Request, response: Response) {
    const auth = requireRequestAuth(request)
    response.json(successResponse('Role updated', await roleService.update(positiveId(request.params.id), auth.organizationId, roleBody(request))))
  },
  async remove(request: Request, response: Response) {
    await roleService.remove(positiveId(request.params.id), requireRequestAuth(request).organizationId)
    response.json(successResponse('Role deleted', null))
  },
}

