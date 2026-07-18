import { createContext, useContext } from 'react'

export interface UnlockApi {
  /** Whether the backend has an edit PIN configured at all. */
  gateEnabled: boolean
  /** Whether this browser currently holds a valid unlock token. */
  unlocked: boolean
  /** Opens the PIN keypad; resolves once unlocked, rejects if cancelled. */
  requestUnlock: () => Promise<void>
}

export const UnlockContext = createContext<UnlockApi | null>(null)

export const useUnlock = (): UnlockApi => {
  const ctx = useContext(UnlockContext)
  if (!ctx) throw new Error('useUnlock must be used within UnlockProvider')
  return ctx
}
