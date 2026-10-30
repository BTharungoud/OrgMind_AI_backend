import { describe, expect, it } from 'vitest'
import { toGeminiApiError } from '../../src/services/gemini.service.js'
import { ApiError } from '../../src/utils/apiError.js'

describe('Gemini error translation', () => {
  it('returns an actionable error for a leaked key', () => {
    const translated = toGeminiApiError(new Error(JSON.stringify({
      error: {
        code: 403,
        message: 'Your API key was reported as leaked. Please use another API key.',
        status: 'PERMISSION_DENIED',
      },
    })))

    expect(translated.statusCode).toBe(502)
    expect(translated.code).toBe('GEMINI_API_KEY_REJECTED')
    expect(translated.message).not.toContain('403')
  })

  it('maps provider quota exhaustion to a retriable service error', () => {
    const translated = toGeminiApiError(new Error(JSON.stringify({
      error: { code: 429, message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED' },
    })))

    expect(translated.statusCode).toBe(503)
    expect(translated.code).toBe('GEMINI_RATE_LIMITED')
  })

  it('preserves application errors such as timeouts', () => {
    const timeout = new ApiError(504, 'The AI request timed out.', 'AI_TIMEOUT')
    expect(toGeminiApiError(timeout)).toBe(timeout)
  })
})

