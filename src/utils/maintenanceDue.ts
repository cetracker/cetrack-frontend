import type { MaintenanceDue, MaintenanceTask } from '@/types/api'
import { formatDistanceKm } from './formatters'

export type DueSeverity = 'overdue' | 'ok' | 'none'

export interface DueDisplay {
  severity: DueSeverity
  label: string
}

const DAY = 86_400
const DISTANCE_PRECISION_M = 50
const TIME_PRECISION_S = DAY / 2

/** Seconds → whole days, half-up. formatDuration ("H:MM:SS") is wrong at this scale. */
export const formatDays = (seconds: number): string => {
  const days = Math.round(Math.abs(seconds) / DAY)
  if (days === 0) return 'less than a day'
  if (days === 1) return '1 day'
  return `${days} days`
}

/** "800.0 km / 90 days" | "800.0 km" | "90 days" */
export const formatIntervalSummary = (
  task: Pick<MaintenanceTask, 'distanceInterval' | 'timeInterval'>,
): string => {
  const parts: string[] = []
  if (task.distanceInterval != null) parts.push(`${formatDistanceKm(task.distanceInterval)} km`)
  if (task.timeInterval != null) parts.push(formatDays(task.timeInterval))
  return parts.join(' / ')
}

/** "230.0 km left" / "40.0 km over"; null when the distance axis isn't evaluable. */
export const remainingDistanceLabel = (due?: MaintenanceDue): string | null => {
  if (!due || due.distanceRemaining == null) return null
  const km = formatDistanceKm(Math.abs(due.distanceRemaining))
  return due.distanceRemaining < 0 ? `${km} km over` : `${km} km left`
}

/** "12 days left" / "3 days over"; null when the time axis isn't evaluable. */
export const remainingTimeLabel = (due?: MaintenanceDue): string | null => {
  if (!due || due.timeRemaining == null) return null
  const days = formatDays(due.timeRemaining)
  return due.timeRemaining < 0 ? `${days} over` : `${days} left`
}

/**
 * Never re-derives due-ness — `due.due` is authoritative. Only phrases the
 * remaining/overdue amounts for display.
 */
export const deriveDueDisplay = (
  task: Pick<MaintenanceTask, 'distanceInterval' | 'timeInterval' | 'due'>,
): DueDisplay => {
  const { due } = task
  if (!due) return { severity: 'none', label: '—' }

  const distanceEvaluable = due.distanceRemaining != null
  const timeEvaluable = due.timeRemaining != null
  if (!distanceEvaluable && !timeEvaluable) {
    return { severity: 'none', label: 'No ride data yet' }
  }

  if (due.due) {
    const overdueParts: string[] = []
    if (
      distanceEvaluable &&
      due.distanceRemaining! <= 0 &&
      Math.abs(due.distanceRemaining!) >= DISTANCE_PRECISION_M
    ) {
      overdueParts.push(`${formatDistanceKm(Math.abs(due.distanceRemaining!))} km`)
    }
    if (
      timeEvaluable &&
      due.timeRemaining! <= 0 &&
      Math.abs(due.timeRemaining!) >= TIME_PRECISION_S
    ) {
      overdueParts.push(formatDays(due.timeRemaining!))
    }
    return {
      severity: 'overdue',
      label: overdueParts.length > 0 ? `Overdue by ${overdueParts.join(' and ')}` : 'Due now',
    }
  }

  const distanceFraction =
    distanceEvaluable && task.distanceInterval
      ? due.distanceRemaining! / task.distanceInterval
      : undefined
  const timeFraction =
    timeEvaluable && task.timeInterval ? due.timeRemaining! / task.timeInterval : undefined

  const useTime =
    timeFraction != null && (distanceFraction == null || timeFraction < distanceFraction)

  return {
    severity: 'ok',
    label: useTime
      ? `Due in ${formatDays(due.timeRemaining!)}`
      : `Due in ${formatDistanceKm(due.distanceRemaining!)} km`,
  }
}
