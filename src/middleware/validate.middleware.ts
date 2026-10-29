import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

export const validate = (schema: ZodType): RequestHandler => (request, _response, next) => {
  schema.parse({ body: request.body as unknown, query: request.query, params: request.params })
  next()
}

