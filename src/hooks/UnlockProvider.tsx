import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authStatusQuery, getStoredUnlockToken, storeUnlockToken } from '@/api/auth'
import { setUnlockHandler } from '@/api/client'
import { UnlockContext } from './useUnlock'
import { PinKeypadDialog } from '@/components/layout/PinKeypadDialog'

export const UnlockProvider = ({ children }: { children: ReactNode }) => {
  const { data: status } = useQuery({ ...authStatusQuery(), refetchOnWindowFocus: false })
  const gateEnabled = status?.enabled ?? false
  const [unlocked, setUnlocked] = useState(() => !!getStoredUnlockToken())
  const [dialogOpen, setDialogOpen] = useState(false)

  // Single-flight: concurrent 401s (or a manual click while the keypad is
  // already open) all await the SAME pending promise instead of stacking dialogs.
  const pendingRef = useRef<Promise<string> | null>(null)
  const resolverRef = useRef<{ resolve: (token: string) => void; reject: (err: unknown) => void } | null>(null)

  const promptUnlock = useCallback((): Promise<string> => {
    if (pendingRef.current) return pendingRef.current
    setDialogOpen(true)
    const promise = new Promise<string>((resolve, reject) => {
      resolverRef.current = { resolve, reject }
    }).finally(() => {
      pendingRef.current = null
    })
    pendingRef.current = promise
    return promise
  }, [])

  useEffect(() => {
    setUnlockHandler(promptUnlock)
    return () => setUnlockHandler(null)
  }, [promptUnlock])

  const handleUnlocked = useCallback((token: string) => {
    storeUnlockToken(token)
    setUnlocked(true)
    setDialogOpen(false)
    resolverRef.current?.resolve(token)
    resolverRef.current = null
  }, [])

  const handleCancel = useCallback(() => {
    setDialogOpen(false)
    resolverRef.current?.reject(new Error('unlock cancelled'))
    resolverRef.current = null
  }, [])

  const api = useMemo(
    () => ({
      gateEnabled,
      unlocked,
      requestUnlock: () => promptUnlock().then(() => {}),
    }),
    [gateEnabled, unlocked, promptUnlock],
  )

  return (
    <UnlockContext.Provider value={api}>
      {children}
      <PinKeypadDialog open={dialogOpen} onUnlocked={handleUnlocked} onCancel={handleCancel} />
    </UnlockContext.Provider>
  )
}
