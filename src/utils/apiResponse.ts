export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  errors: unknown
}

export const successResponse = <T>(message: string, data: T): ApiEnvelope<T> => ({
  success: true,
  message,
  data,
  errors: null,
})

