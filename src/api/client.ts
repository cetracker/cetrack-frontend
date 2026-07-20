import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { clearStoredUnlockToken, getStoredUnlockToken, storeUnlockToken } from './auth'

export interface ApiError {
  status: number
  code?: string
  message: string
  details?: Record<string, unknown>
  /** Seconds until the edit-gate cooldown lifts (429 TOO_MANY_ATTEMPTS only). */
  retryAfterSeconds?: number
}

export class ApiException extends Error implements ApiError {
  status: number
  code?: string
  details?: Record<string, unknown>
  retryAfterSeconds?: number

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiException'
    this.status = apiError.status
    this.code = apiError.code
    this.details = apiError.details
    this.retryAfterSeconds = apiError.retryAfterSeconds
  }
}

export const isApiError = (err: unknown): err is ApiError =>
  typeof err === 'object' && err !== null && 'status' in err && 'message' in err

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const UNLOCK_PATH = '/auth/unlock'

/**
 * Resolves with a fresh unlock token once the user re-enters the PIN, or
 * rejects if they cancel. Registered by UnlockProvider (kept as a plain
 * setter, not an import, so client.ts never depends on UI/context code).
 */
type UnlockHandler = () => Promise<string>
let unlockHandler: UnlockHandler | null = null
export const setUnlockHandler = (handler: UnlockHandler | null): void => {
  unlockHandler = handler
}

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredUnlockToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

type RetriableConfig = InternalAxiosRequestConfig & { _retriedForUnlock?: boolean }

// shared Error schema (common-api.yaml), used by all endpoints incl. tour-api.
type BackendErrorShape = {
  code?: string
  message?: string
  details?: Record<string, unknown>
}

const toApiError = (err: AxiosError<BackendErrorShape | string>): ApiError => {
  const status = err.response?.status ?? 0
  const body = err.response?.data
  const retryAfterHeader = err.response?.headers?.['retry-after']
  const retryAfterSeconds = retryAfterHeader !== undefined ? Number(retryAfterHeader) : undefined
  if (typeof body === 'string' && body.length > 0) {
    return { status, message: body, retryAfterSeconds }
  }
  if (body && typeof body === 'object' && typeof body.message === 'string') {
    return { status, code: body.code, message: body.message, details: body.details, retryAfterSeconds }
  }
  return { status, message: err.message ?? 'Unexpected error', retryAfterSeconds }
}

client.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError<BackendErrorShape | string>) => {
    const config = err.config as RetriableConfig | undefined
    const status = err.response?.status ?? 0

    // Edit-gate 401 (CE-0118): clear the stale token, prompt the keypad, retry
    // once with the fresh token. /auth/unlock's own 401 (wrong PIN) is never
    // intercepted here — that's a normal ApiException for the dialog to show.
    if (status === 401 && unlockHandler && config && !config._retriedForUnlock && config.url !== UNLOCK_PATH) {
      clearStoredUnlockToken()
      try {
        const token = await unlockHandler()
        storeUnlockToken(token)
        config._retriedForUnlock = true
        return client.request(config)
      } catch {
        // user cancelled the keypad — fall through and report the original 401
      }
    }

    throw new ApiException(toApiError(err))
  },
)
