import axios, { AxiosError, type AxiosResponse } from 'axios'

export interface ApiError {
  status: number
  message: string
  details?: string[]
}

export const isApiError = (err: unknown): err is ApiError =>
  typeof err === 'object' && err !== null && 'status' in err && 'message' in err

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

type BackendErrorShape = {
  message?: string
  error?: string
  detail?: string
  errors?: unknown
}

const parseDetails = (errors: unknown): string[] | undefined => {
  if (!errors) return undefined
  if (Array.isArray(errors)) {
    return errors
      .map((e) => (typeof e === 'string' ? e : e?.message ?? JSON.stringify(e)))
      .filter(Boolean)
  }
  if (typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>).map(
      ([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`,
    )
  }
  return [String(errors)]
}

client.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<BackendErrorShape>) => {
    const status = err.response?.status ?? 0
    const body = err.response?.data
    const message =
      body?.message ??
      body?.error ??
      body?.detail ??
      err.message ??
      'Unexpected error'
    const apiError: ApiError = {
      status,
      message,
      details: parseDetails(body?.errors),
    }
    return Promise.reject(apiError)
  },
)
