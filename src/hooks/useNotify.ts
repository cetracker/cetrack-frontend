import { createContext, useContext } from 'react'
import type { AlertColor } from '@mui/material'

export interface Notification {
  id: number
  message: string
  severity: AlertColor
}

export interface NotifyApi {
  notify: (message: string, severity?: AlertColor) => void
  dismiss: (id: number) => void
  notifications: Notification[]
}

export const NotifyContext = createContext<NotifyApi | null>(null)

export const useNotify = (): NotifyApi => {
  const ctx = useContext(NotifyContext)
  if (!ctx) throw new Error('useNotify must be used within NotifyProvider')
  return ctx
}
