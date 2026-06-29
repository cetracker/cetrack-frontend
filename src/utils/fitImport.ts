import type { Bike, FitDraftTour, TourCreateRequest } from '@/types/api'

export const suggestTitle = (startedAt: string, distanceMeters: number): string => {
  const d = new Date(startedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return `${date} ${time} - ${(distanceMeters / 1000).toFixed(1)}km`
}

export const draftToCreateRequest = (
  draft: FitDraftTour,
  title: string,
  bike: Bike,
): TourCreateRequest => ({
  title,
  distance: draft.distance,
  durationMoving: draft.durationMoving,
  durationRecorded: draft.durationRecorded,
  durationElapsed: draft.durationElapsed,
  altUp: draft.altUp,
  altDown: draft.altDown,
  powerTotal: draft.powerTotal,
  startedAt: draft.startedAt,
  startYear: draft.startYear,
  startMonth: draft.startMonth,
  startDay: draft.startDay,
  bike,
  source: 'FIT',
})
