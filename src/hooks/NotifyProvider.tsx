import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Alert, Box, Snackbar } from '@mui/material'
import type { AlertColor } from '@mui/material'
import { NotifyContext, type Notification } from './useNotify'

const AUTO_HIDE_MS = 6000

// Snackbar clones its child and forwards transition props (including `direction`
// when the transition is Slide). A plain styled Box with forwardRef absorbs
// those props harmlessly — Stack/Grid2 would reject `direction: 'up' | ...`.
const SnackbarStack = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function SnackbarStack({ children }, ref) {
    return (
      <Box
        ref={ref}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          width: '100%',
          maxWidth: 480,
        }}
      >
        {children}
      </Box>
    )
  },
)

let seq = 0
const nextId = () => ++seq

export const NotifyProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Notification[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
    setItems((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, severity: AlertColor = 'info') => {
      const id = nextId()
      setItems((prev) => [...prev, { id, message, severity }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_HIDE_MS),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => clearTimeout(t))
      map.clear()
    }
  }, [])

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
        <SnackbarStack>
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
        </SnackbarStack>
      </Snackbar>
    </NotifyContext.Provider>
  )
}
