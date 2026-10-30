import 'dotenv/config'
import { z } from 'zod'

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform(value => value === 'true')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8081),
  API_PREFIX: z.string().default(''),
  DATABASE_URL: z.string().min(1),
  DATABASE_CA_CERT_PATH: z.string().trim().optional(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: booleanString,
  DATABASE_POOL_MAX: z.coerce.number().int().positive().max(50).default(10),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_GENERATION_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-2'),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(768),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGINS: z.string().min(1),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  RETRIEVAL_LIMIT: z.coerce.number().int().positive().max(20).default(6),
  DEFAULT_ORGANIZATION_ID: z.coerce.number().int().positive().default(1),
  ENABLE_DEV_REGISTRATION_TOKENS: booleanString,
  SUPER_ADMIN_USERNAME: z.string().trim().min(3).max(100).default('superadmin'),
  SUPER_ADMIN_EMAIL: z.email().default('superadmin@orgmind.local'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const details = result.error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  throw new Error(`Invalid environment configuration: ${details}`)
}

const parsed = result.data

export const env = {
  ...parsed,
  API_PREFIX: parsed.API_PREFIX.replace(/\/$/, ''),
  CORS_ORIGINS: parsed.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean),
} as const

