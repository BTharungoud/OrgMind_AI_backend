import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'
import { env } from '../config/env.js'
import type { AuthTokenPayload } from '../types/auth.js'
import { ApiError } from '../utils/apiError.js'

interface MembershipRow {
  userId: number
  username: string
  organizationId: number
  departmentId: number | null
  roleId: number
  roleName: string
  isAdmin: boolean
}

const verifyAndLoad = async (authorization: string | undefined) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new ApiError(401, 'A valid Bearer token is required.', 'UNAUTHORIZED')
  }
  let payload: AuthTokenPayload
  try {
    payload = jwt.verify(authorization.slice(7), env.JWT_SECRET, {
      issuer: 'orgmind-ai', audience: 'orgmind-web',
    }) as AuthTokenPayload
  } catch {
    throw new ApiError(401, 'The access token is invalid or expired.', 'INVALID_TOKEN')
  }
  const result = await query<MembershipRow>(
    `SELECT u.id::int AS "userId", u.username, u.organization_id::int AS "organizationId",
            u.department_id::int AS "departmentId", r.id::int AS "roleId",
            r.name AS "roleName", r.is_admin AS "isAdmin"
       FROM orgmind.app_user u
       JOIN orgmind.role r ON r.id = u.role_id AND r.organization_id = u.organization_id
       JOIN orgmind.organization o ON o.id = u.organization_id
      WHERE u.id = $1 AND u.active AND r.active AND o.active`,
    [payload.userId],
  )
  const membership = result.rows[0]
  if (!membership) throw new ApiError(401, 'The user account is inactive or unavailable.', 'INVALID_SESSION')
  return membership
}

export const requireAuth: RequestHandler = (request, _response, next) => {
  void verifyAndLoad(request.header('authorization')).then(auth => {
    request.auth = auth
    next()
  }).catch(next)
}

export const optionalAuth: RequestHandler = (request, _response, next) => {
  if (!request.header('authorization')) {
    next()
    return
  }
  void verifyAndLoad(request.header('authorization')).then(auth => {
    request.auth = auth
    next()
  }).catch(next)
}

export const requireAdmin: RequestHandler = (request, _response, next) => {
  if (!request.auth?.isAdmin) {
    next(new ApiError(403, 'Administrator access is required.', 'FORBIDDEN'))
    return
  }
  next()
}

export const requireSuperAdmin: RequestHandler = (request, _response, next) => {
  if (request.auth?.roleName.toLowerCase() !== 'super admin') {
    next(new ApiError(403, 'Super Admin access is required.', 'FORBIDDEN'))
    return
  }
  next()
}

