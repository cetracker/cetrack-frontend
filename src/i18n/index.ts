import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { enUS } from 'date-fns/locale/en-US'
import { de as deLocale } from 'date-fns/locale/de'
import en from './locales/en.json'
import de from './locales/de.json'

const LANG_STORAGE_KEY = 'cetrack:lang'

export type AppLanguage = 'en' | 'de'

const detectLanguage = (): AppLanguage => {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (stored === 'en' || stored === 'de') return stored
  } catch {
    // localStorage unavailable (e.g. node test env) — fall through
  }
  const navLang = typeof navigator !== 'undefined' ? navigator.language : undefined
  return navLang?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18next.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng)
  } catch {
    // localStorage unavailable — ignore
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lng
})

export const appLanguage = (): AppLanguage => (i18next.language === 'de' ? 'de' : 'en')

export const currentDateFnsLocale = () => (appLanguage() === 'de' ? deLocale : enUS)

export default i18next
