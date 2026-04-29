import axios, { AxiosError, type AxiosResponse } from 'axios'

export interface ApiError {
  status: number
  message: string
  details?: string[]
}

export class ApiException extends Error implements ApiError {
  status: number
  details?: string[]

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiException'
    this.status = apiError.status
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

type BackendErrorShape = {
  message?: string
  error?: string
  detail?: string
  errors?: unknown
}

const stringifyUnknown = (val: unknown): string => {
  if (typeof val === 'string') return val
  if (val instanceof Error) return val.message
  try {
    return JSON.stringify(val) ?? String(val)
  } catch {
    return String(val)
  }
}

const parseDetails = (errors: unknown): string[] | undefined => {
  if (!errors) return undefined
  if (Array.isArray(errors)) {
    return errors
      .map((e: unknown) => {
        if (typeof e === 'string') return e
        if ((e as Record<string, unknown> | null)?.message != null)
          return String((e as Record<string, unknown>).message)
        return stringifyUnknown(e)
      })
      .filter(Boolean)
  }
  if (typeof errors === 'object') {
    return Object.entries(errors as Record<string, unknown>).map(
      ([k, v]) => `${k}: ${stringifyUnknown(v)}`,
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
    throw new ApiException(apiError)
  },
)
