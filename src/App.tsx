import { useMemo, useState, type ReactNode } from 'react'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import { deDE as coreDeDE } from '@mui/material/locale'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { deDE } from '@mui/x-date-pickers/locales'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { darkTheme, lightTheme } from './theme'
import { NotifyProvider } from './hooks/NotifyProvider'
import { UnlockProvider } from './hooks/UnlockProvider'
import { ColorModeContext, type ColorMode } from './hooks/useColorMode'
import { OnboardingContext } from './hooks/useOnboarding'
import { useLanguage } from './hooks/useLanguage'
import { DateFormatContext, useDateFormat } from './hooks/useDateFormat'
import { dateFnsLocale, setFormatProfile, type FormatProfile } from './i18n/formatProfile'

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
  const { lang } = useLanguage()
  const { format } = useDateFormat()
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
  // `format` is not read here — it's a dependency purely to recreate the theme
  // (and thus the ThemeProvider value, forcing a full re-render) whenever the
  // date/number format profile changes, since plain formatters read a module
  // global rather than subscribing to a hook.
  const theme = useMemo(() => {
    const base = mode === 'dark' ? darkTheme : lightTheme
    return lang === 'de' ? createTheme(base, coreDeDE) : base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lang, format])
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

const DATE_FORMAT_STORAGE_KEY = 'cetrack:dateFormat'

const initialFormat = (): FormatProfile => {
  try {
    const stored = localStorage.getItem(DATE_FORMAT_STORAGE_KEY)
    if (stored === 'iso' || stored === 'de' || stored === 'us') return stored
  } catch {
    // localStorage unavailable (e.g. node test env)
  }
  return 'iso'
}

const DateFormatProvider = ({ children }: { children: ReactNode }) => {
  const [format, setFormatState] = useState<FormatProfile>(() => {
    const initial = initialFormat()
    setFormatProfile(initial)
    return initial
  })
  const api = useMemo(
    () => ({
      format,
      setFormat: (next: FormatProfile) => {
        setFormatProfile(next)
        try {
          localStorage.setItem(DATE_FORMAT_STORAGE_KEY, next)
        } catch {
          // localStorage unavailable (e.g. node test env)
        }
        setFormatState(next)
      },
    }),
    [format],
  )
  return <DateFormatContext.Provider value={api}>{children}</DateFormatContext.Provider>
}

const LocaleProviders = ({ children }: { children: ReactNode }) => {
  const { lang } = useLanguage()
  const { format } = useDateFormat()
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={dateFnsLocale(format)}
      localeText={
        lang === 'de'
          ? deDE.components.MuiLocalizationProvider.defaultProps.localeText
          : undefined
      }
    >
      {children}
    </LocalizationProvider>
  )
}

export const App = () => (
  <DateFormatProvider>
    <ColorModeProvider>
      <OnboardingProvider>
        <LocaleProviders>
          <QueryClientProvider client={queryClient}>
            <NotifyProvider>
              <UnlockProvider>
                <RouterProvider router={router} />
              </UnlockProvider>
            </NotifyProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </LocaleProviders>
      </OnboardingProvider>
    </ColorModeProvider>
  </DateFormatProvider>
)
