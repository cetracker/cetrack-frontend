import { format, parseISO } from 'date-fns'
import type { Bike, Part, PartType } from '@/types/api'

export const formatDate = (iso?: string | null): string => {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'yyyy-MM-dd HH:mm')
  } catch {
    return ''
  }
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

const withLocalOffset = (date: Date): string => {
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

/** Watts (summed instantaneous) → kWh
 *  Conversion is unusual because backend stores cumulative Watts (W). Matches existing
 *  frontend behaviour: assume values are watt-seconds-equivalent and divide by 3_600_000. */
export const formatKWh = (power: number | null | undefined): string => {
  if (power == null) return ''
  return (power / 3_600_000).toFixed(2)
}

export const bikeName = (bike?: Bike | null): string => {
  if (!bike) return ''
  const mfr = bike.manufacturer?.trim()
  return mfr ? `${mfr} ${bike.model}` : bike.model
}

/** The raw identity fields shared by `Part` and a report row. */
type PartIdentityFields = Pick<
  Part,
  'label' | 'manufacturer' | 'model' | 'serialNumber'
>

/**
 * The single rule for a part's displayed identity, used by list, pickers,
 * detail and report: the user's label if given, otherwise the structured
 * make/model plus serial number. Deliberately mount-independent (no part type).
 */
export const partIdentity = (part?: PartIdentityFields | null): string => {
  if (!part) return ''
  const label = part.label?.trim()
  if (label) return label
  const makeModel = [part.manufacturer?.trim(), part.model?.trim()]
    .filter(Boolean)
    .join(' ')
  const serial = part.serialNumber?.trim()
  if (makeModel && serial) return `${makeModel} #${serial}`
  return makeModel || (serial ? `#${serial}` : '')
}

/**
 * Secondary, muted line shown in pickers to tell two otherwise-identical
 * parts apart: serial number first, else first-used date, else purchase
 * date, else vendor.
 */
export const partDisambiguator = (part?: Part | null): string => {
  if (!part) return ''
  const serial = part.serialNumber?.trim()
  if (serial) return `#${serial}`
  if (part.firstUsedDate) return `first used ${formatDate(part.firstUsedDate)}`
  if (part.boughtAt) return `bought ${formatDate(part.boughtAt)}`
  return part.vendor?.trim() ?? ''
}

/** Find the currently-active (validUntil null) relation for a part or part type. */
export const findActiveRelation = (
  entity: Part | PartType | undefined | null,
) => entity?.partTypeRelations?.find((r) => !r.validUntil) ?? null

export const findLastRelation = (entity: Part | PartType | undefined | null) =>
  entity?.partTypeRelations
    ?.slice()
    .sort((a, b) =>
      (b.validUntil ?? b.validFrom).localeCompare(a.validUntil ?? a.validFrom),
    )[0] ?? null
