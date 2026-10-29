process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ??= 'postgres://test:test@localhost:5432/orgmind_test'
process.env.GEMINI_API_KEY ??= 'test-key'
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters'
process.env.CORS_ORIGINS ??= 'http://localhost:5173'

