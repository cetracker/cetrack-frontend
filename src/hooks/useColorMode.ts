import { createContext, useContext } from 'react'

export type ColorMode = 'light' | 'dark'

export interface ColorModeApi {
  mode: ColorMode
  toggle: () => void
}

export const ColorModeContext = createContext<ColorModeApi | null>(null)

export const useColorMode = (): ColorModeApi => {
  const ctx = useContext(ColorModeContext)
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider')
  return ctx
}
