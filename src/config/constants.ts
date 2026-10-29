export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  DEPARTMENT_ADMIN: 'Department Admin',
  EMPLOYEE: 'Employee',
} as const

export const PUBLIC_ROLE_ALIASES = new Set([
  'super admin',
  'engineering admin',
  'department admin',
  'admin',
])

export const SUPPORTED_UPLOAD_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
])

export const DEFAULT_CATEGORY = 'General'

