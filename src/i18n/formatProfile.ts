import { de, enUS, sv } from 'date-fns/locale'
import type { Locale } from 'date-fns'

export type FormatProfile = 'iso' | 'de' | 'us'

const DATE_FNS_LOCALES: Record<FormatProfile, Locale> = { iso: sv, de, us: enUS }

export const dateFnsLocale = (profile: FormatProfile): Locale => DATE_FNS_LOCALES[profile]

const NUMBER_LOCALES: Record<FormatProfile, string> = { iso: 'en-US', de: 'de-DE', us: 'en-US' }

export const numberFormatter = (profile: FormatProfile): Intl.NumberFormat =>
  new Intl.NumberFormat(
    NUMBER_LOCALES[profile],
    profile === 'iso' ? { useGrouping: false } : undefined,
  )

let currentFormatProfile: FormatProfile = 'iso'

export const getFormatProfile = (): FormatProfile => currentFormatProfile

export const setFormatProfile = (profile: FormatProfile): void => {
  currentFormatProfile = profile
}
