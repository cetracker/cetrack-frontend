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
