import { z } from 'zod'

const password = z.string().min(8).max(128)
const wrapper = { query: z.unknown(), params: z.unknown() }

export const loginSchema = z.object({
  ...wrapper,
  body: z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(128) }),
})

export const registerSchema = z.object({
  ...wrapper,
  body: z.object({
    username: z.string().trim().min(3).max(100),
    email: z.email().max(320),
    password,
    confirmPassword: z.string(),
    departmentId: z.coerce.number().int().positive(),
    roleId: z.coerce.number().int().positive(),
    registrationToken: z.string().trim().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match.', path: ['confirmPassword'],
  }),
})

export const refreshSchema = z.object({ ...wrapper, body: z.object({ refreshToken: z.string().min(32) }) })
export const forgotPasswordSchema = z.object({
  ...wrapper,
  body: z.object({ username: z.string().trim().min(1), newPassword: password }),
})

