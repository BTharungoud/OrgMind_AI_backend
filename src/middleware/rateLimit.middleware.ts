import { rateLimit } from 'express-rate-limit'

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.', data: null, errors: null, code: 'RATE_LIMITED' },
}

export const authRateLimit = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 30 })
export const aiRateLimit = rateLimit({ ...base, windowMs: 60_000, limit: 20 })
export const ingestionRateLimit = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 20 })

