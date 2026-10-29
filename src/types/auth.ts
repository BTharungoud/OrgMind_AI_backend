export interface AuthTokenPayload {
  userId: number
  username: string
  organizationId: number
  departmentId: number | null
  roleId: number
  roleName: string
  isAdmin: boolean
}

export interface DatabaseUser {
  id: number
  username: string
  email: string
  passwordHash: string
  organizationId: number
  departmentId: number | null
  departmentName: string | null
  roleId: number
  roleName: string
  isAdmin: boolean
  active: boolean
}

