import { format, parseISO } from 'date-fns'
import { dateFnsLocale, getFormatProfile, numberFormatter } from '@/i18n/formatProfile'
import { currentDateFnsLocale } from '@/i18n'
import type { Bike, Component } from '@/types/api'

export const formatDate = (iso?: string | null): string => {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'P', { locale: dateFnsLocale(getFormatProfile()) })
  } catch {
    return ''
  }
}

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'Pp', { locale: dateFnsLocale(getFormatProfile()) })
  } catch {
    return ''
  }
}

export const formatNumber = (n: number): string => numberFormatter(getFormatProfile()).format(n)

/**
 * Abbreviated month name for a 1-12 month number (e.g. 3 -> "Mar"/"Mär").
 * Follows the UI *language*, not the format profile: a month name is a word,
 * whereas the profile only decides numeric date/number layout (its `iso`
 * profile borrows the Swedish locale purely to get `YYYY-MM-DD`).
 */
export const formatMonthShort = (month: number): string => {
  if (!Number.isInteger(month) || month < 1 || month > 12) return String(month ?? '')
  return format(new Date(2000, month - 1, 1), 'LLL', { locale: currentDateFnsLocale() })
}

/**
 * Convert a local-calendar `Date` (e.g. from a date picker where the user
 * picked a day) to an ISO-8601 string that represents the *start of that day
 * in the browser's local timezone*, preserving the local offset.
 *
 * Example (Europe/Berlin, DST): picking 2026-04-22 yields
 * `2026-04-22T00:00:00.000+02:00` — which the backend can parse into an
 * OffsetDateTime whose `truncatedTo(DAYS).minus(1s)` correctly gives the
 * local end-of-previous-day (i.e. `2026-04-21T23:59:59+02:00`, 21:59:59Z).
 */
export const toLocalDayStartISO = (d: Date | null | undefined): string | null => {
  if (!d) return null
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  return withLocalOffset(local)
}

/** Like {@link toLocalDayStartISO} but for the end of the selected day
 *  (`23:59:59.999` local). */
export const toLocalDayEndISO = (d: Date | null | undefined): string | null => {
  if (!d) return null
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  return withLocalOffset(local)
}

export const withLocalOffset = (date: Date): string => {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  const ms = pad(date.getMilliseconds(), 3)
  // getTimezoneOffset returns minutes WEST of UTC, so invert for ISO offset
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const offH = pad(Math.floor(Math.abs(offsetMin) / 60))
  const offM = pad(Math.abs(offsetMin) % 60)
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}.${ms}${sign}${offH}:${offM}`
}

/** Seconds → "H:MM:SS" */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null) return ''
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Metres → km with one decimal */
export const formatDistanceKm = (meters: number | null | undefined): string => {
  if (meters == null) return ''
  return (meters / 1000).toFixed(1)
}

/** Accumulated mechanical work in Joules → kJ.
 *  `powerTotal` stores the rider's pedal work in Joules (W·s); divide by 1000 for kJ. */
export const formatKJ = (work: number | null | undefined): string => {
  if (work == null) return ''
  return Math.round(work / 1000).toString()
}

/** A bike's displayed identity: its name if given, else make + model. */
export const bikeIdentity = (bike?: Bike | null): string => {
  if (!bike) return ''
  return (
    bike.name?.trim() ||
    [bike.manufacturer?.trim(), bike.model?.trim()].filter(Boolean).join(' ')
  )
}

/** The raw identity fields shared by `Component` and a mileage report row. */
type ComponentIdentityFields = {
  label?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
}

/**
 * The single rule for a component's displayed identity, used by list,
 * pickers, detail and report: the user's label if given, otherwise the
 * structured make/model plus serial number.
 */
export const componentIdentity = (
  component?: ComponentIdentityFields | null,
): string => {
  if (!component) return ''
  const label = component.label?.trim()
  if (label) return label
  const makeModel = [component.manufacturer?.trim(), component.model?.trim()]
    .filter(Boolean)
    .join(' ')
  const serial = component.serialNumber?.trim()
  if (makeModel && serial) return `${makeModel} #${serial}`
  return makeModel || (serial ? `#${serial}` : '')
}

/**
 * Secondary, muted line shown in pickers and the component list to tell two
 * otherwise-identical components apart. Shows all non-empty attributes in a
 * fixed order: serial, model, manufacturer, purchase date, vendor.
 * Price, currency, and retirement info are omitted.
 */
export const componentDisambiguator = (component?: Component | null): string => {
  if (!component) return ''
  return [
    component.serialNumber?.trim() ? `#${component.serialNumber.trim()}` : null,
    component.model?.trim() || null,
    component.manufacturer?.trim() || null,
    component.purchaseDate ? formatDate(component.purchaseDate) : null,
    component.vendor?.trim() || null,
  ]
    .filter(Boolean)
    .join(', ')
}
