export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
    public readonly errors: unknown = null,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

