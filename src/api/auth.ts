import { client } from './client'
import type { AuthStatus, UnlockRequest, UnlockResponse } from '@/types/api'

const UNLOCK_TOKEN_STORAGE_KEY = 'cetrack:unlockToken'

export const getStoredUnlockToken = (): string | null =>
  localStorage.getItem(UNLOCK_TOKEN_STORAGE_KEY)

export const storeUnlockToken = (token: string): void => {
  localStorage.setItem(UNLOCK_TOKEN_STORAGE_KEY, token)
}

export const clearStoredUnlockToken = (): void => {
  localStorage.removeItem(UNLOCK_TOKEN_STORAGE_KEY)
}

export const authStatusQueryKey = ['auth', 'status'] as const

export const authStatusQuery = () => ({
  queryKey: authStatusQueryKey,
  queryFn: async (): Promise<AuthStatus> => {
    const res = await client.get<AuthStatus>('/auth/status')
    return res.data
  },
})

export const unlock = async (pin: string): Promise<UnlockResponse> => {
  const res = await client.post<UnlockResponse>('/auth/unlock', { pin } satisfies UnlockRequest)
  return res.data
}
