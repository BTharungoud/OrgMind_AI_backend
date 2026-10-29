import { describe, it } from 'vitest'

describe.skip('database integration', () => {
  it('runs only against a dedicated migrated test database', () => {
    // Enable after TEST_DATABASE_URL points to a disposable pgvector database.
  })
})

