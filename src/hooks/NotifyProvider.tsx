import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Alert, Snackbar, Stack } from '@mui/material'
import type { AlertColor } from '@mui/material'
import { NotifyContext, type Notification } from './useNotify'

let seq = 0
const nextId = () => ++seq

export const NotifyProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Notification[]>([])

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, severity: AlertColor = 'info') => {
      setItems((prev) => [...prev, { id: nextId(), message, severity }])
    },
    [],
  )

  const value = useMemo(
    () => ({ notify, dismiss, notifications: items }),
    [notify, dismiss, items],
  )

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        open={items.length > 0}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Stack spacing={1} sx={{ width: '100%', maxWidth: 480 }}>
          {items.map((n) => (
            <Alert
              key={n.id}
              severity={n.severity}
              variant="filled"
              onClose={() => dismiss(n.id)}
              sx={{ boxShadow: 3 }}
            >
              {n.message}
            </Alert>
          ))}
        </Stack>
      </Snackbar>
    </NotifyContext.Provider>
  )
}
