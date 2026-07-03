import { useMemo, useState, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { deDE } from '@mui/x-date-pickers/locales'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { de } from 'date-fns/locale/de'
import { router } from './router'
import { darkTheme, lightTheme } from './theme'
import { NotifyProvider } from './hooks/NotifyProvider'
import { ColorModeContext, type ColorMode } from './hooks/useColorMode'
import { OnboardingContext } from './hooks/useOnboarding'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

const STORAGE_KEY = 'cetrack:colorMode'

const initialMode = (): ColorMode => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ColorMode>(initialMode)
  const api = useMemo(
    () => ({
      mode,
      toggle: () =>
        setMode((prev) => {
          const next: ColorMode = prev === 'dark' ? 'light' : 'dark'
          localStorage.setItem(STORAGE_KEY, next)
          return next
        }),
    }),
    [mode],
  )
  const theme = mode === 'dark' ? darkTheme : lightTheme
  return (
    <ColorModeContext.Provider value={api}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

const ONBOARDED_KEY = 'cetrack:onboarded'

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === 'true')
  const [tourOpen, setTourOpen] = useState(false)
  const api = useMemo(
    () => ({
      onboarded,
      tourOpen,
      startTour: () => setTourOpen(true),
      finishTour: () => {
        setTourOpen(false)
        localStorage.setItem(ONBOARDED_KEY, 'true')
        setOnboarded(true)
      },
    }),
    [onboarded, tourOpen],
  )
  return <OnboardingContext.Provider value={api}>{children}</OnboardingContext.Provider>
}

export const App = () => (
  <ColorModeProvider>
    <OnboardingProvider>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={de}
        localeText={deDE.components.MuiLocalizationProvider.defaultProps.localeText}
      >
        <QueryClientProvider client={queryClient}>
          <NotifyProvider>
            <RouterProvider router={router} />
          </NotifyProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </LocalizationProvider>
    </OnboardingProvider>
  </ColorModeProvider>
)
