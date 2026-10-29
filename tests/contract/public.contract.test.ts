import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'

describe('public API contracts', () => {
  it('returns the actuator health contract', async () => {
    const response = await request(app).get('/actuator/health').expect(200)
    expect(response.body).toEqual({ status: 'UP' })
  })

  it('validates login without touching the database', async () => {
    const response = await request(app).post('/user/login').send({}).expect(400)
    expect(response.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' })
  })

  it('allows the configured frontend origin', async () => {
    const response = await request(app)
      .options('/user/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})

