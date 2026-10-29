import type { Request, Response } from 'express'
import { authService } from '../services/auth.service.js'
import { ApiError } from '../utils/apiError.js'
import { successResponse } from '../utils/apiResponse.js'

export const authController = {
  async login(request: Request, response: Response) {
    const body = request.body as { username: string; password: string }
    response.json(successResponse('Login successful', await authService.login(body.username, body.password)))
  },
  async register(request: Request, response: Response) {
    const body = request.body as { username: string; email: string; password: string; departmentId: number; roleId: number; registrationToken?: string }
    response.status(201).json(successResponse('Registration successful', await authService.register(body)))
  },
  async refresh(request: Request, response: Response) {
    const body = request.body as { refreshToken: string }
    response.json(successResponse('Token refreshed', await authService.refresh(body.refreshToken)))
  },
  async logout(request: Request, response: Response) {
    if (!request.auth) throw new ApiError(401, 'Authentication is required.', 'UNAUTHORIZED')
    await authService.logout(request.auth.userId)
    response.json(successResponse('Logout successful', null))
  },
  async forgotPassword(request: Request, response: Response) {
    const body = request.body as { username: string; newPassword: string }
    await authService.resetPassword(body.username, body.newPassword)
    response.json(successResponse('Password updated successfully', null))
  },
}

