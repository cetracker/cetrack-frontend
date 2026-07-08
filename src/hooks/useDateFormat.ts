import { createContext, useContext } from 'react'
import type { FormatProfile } from '@/i18n/formatProfile'

export interface DateFormatApi {
  format: FormatProfile
  setFormat: (format: FormatProfile) => void
}

export const DateFormatContext = createContext<DateFormatApi | null>(null)

export const useDateFormat = (): DateFormatApi => {
  const ctx = useContext(DateFormatContext)
  if (!ctx) throw new Error('useDateFormat must be used within DateFormatProvider')
  return ctx
}
