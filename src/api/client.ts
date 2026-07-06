import axios, { AxiosError, type AxiosResponse } from 'axios'

export interface ApiError {
  status: number
  code?: string
  message: string
  details?: Record<string, unknown>
}

export class ApiException extends Error implements ApiError {
  status: number
  code?: string
  details?: Record<string, unknown>

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiException'
    this.status = apiError.status
    this.code = apiError.code
    this.details = apiError.details
  }
}

export const isApiError = (err: unknown): err is ApiError =>
  typeof err === 'object' && err !== null && 'status' in err && 'message' in err

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// shared Error schema (common-api.yaml); tour-api 400/409/500 bodies are
// contract-undefined (bare `description`, no Error schema) — may arrive as
// plain text instead of this shape.
type BackendErrorShape = {
  code?: string
  message?: string
  details?: Record<string, unknown>
}

client.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<BackendErrorShape | string>) => {
    const status = err.response?.status ?? 0
    const body = err.response?.data
    let apiError: ApiError
    if (typeof body === 'string' && body.length > 0) {
      apiError = { status, message: body }
    } else if (body && typeof body === 'object' && typeof body.message === 'string') {
      apiError = {
        status,
        code: body.code,
        message: body.message,
        details: body.details,
      }
    } else {
      apiError = { status, message: err.message ?? 'Unexpected error' }
    }
    throw new ApiException(apiError)
  },
)
