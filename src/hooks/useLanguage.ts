import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '@/i18n'

export interface LanguageApi {
  lang: AppLanguage
  setLang: (lang: AppLanguage) => void
}

export const useLanguage = (): LanguageApi => {
  const { i18n } = useTranslation()
  return {
    lang: i18n.language === 'de' ? 'de' : 'en',
    setLang: (lang) => void i18n.changeLanguage(lang),
  }
}
