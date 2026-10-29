import type { AuthTokenPayload } from './auth.js'

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload
      requestId: string
    }
  }
}

export {}

