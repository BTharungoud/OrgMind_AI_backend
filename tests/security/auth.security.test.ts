import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'

const protectedRequests = [
  ['get', '/department'], ['get', '/role'], ['get', '/organization'],
  ['get', '/chat-history/user/1'], ['get', '/settings/1'], ['get', '/ingestion-requests/mine'],
] as const

describe('protected routes', () => {
  it.each(protectedRequests)('%s %s rejects anonymous access', async (method, path) => {
    const response = await request(app)[method](path).expect(401)
    expect(response.body).toMatchObject({ success: false, code: 'UNAUTHORIZED' })
  })

  it('rejects an invalid bearer token', async () => {
    const response = await request(app).get('/department').set('Authorization', 'Bearer invalid').expect(401)
    expect((response.body as { code?: string }).code).toBe('INVALID_TOKEN')
  })
})

