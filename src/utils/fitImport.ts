import type { Bike, FitDraftTour, TourCreateRequest } from '@/types/api'

// Extract local date-time from ISO string without timezone conversion:
// "2026-06-26T08:13:00+02:00" or "2026-06-26T08:13:00Z" → "2026-06-26 08:13:00"
export const suggestTitle = (startedAt: string, distanceMeters: number): string => {
  const local = startedAt.slice(0, 19).replace('T', ' ')
  return `${local} - ${(distanceMeters / 1000).toFixed(1)}km`
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
