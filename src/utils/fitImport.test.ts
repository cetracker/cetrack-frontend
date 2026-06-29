// Pin timezone so local-time assertions are deterministic across environments.
// The implementation uses getHours() etc. (local time), so in CEST (UTC+2)
// "2026-06-27T03:00:57Z" would display as "2026-06-27 05:00:57".
process.env.TZ = 'UTC'

import { describe, expect, it } from 'vitest'
import { suggestTitle, draftToCreateRequest } from './fitImport'
import type { Bike, FitDraftTour } from '@/types/api'

describe('suggestTitle', () => {
  it('formats UTC startedAt as local wall-clock time (UTC in this env)', () => {
    expect(suggestTitle('2026-06-26T08:13:00Z', 120500)).toBe('2026-06-26 08:13:00 - 120.5km')
  })

  it('rounds distance to one decimal place', () => {
    expect(suggestTitle('2026-01-01T00:00:00Z', 10000)).toBe('2026-01-01 00:00:00 - 10.0km')
  })
})

describe('draftToCreateRequest', () => {
  const bike: Bike = { id: 'bike-1', model: 'Canyon', manufacturer: 'Canyon' }
  const draft: FitDraftTour = {
    title: null,
    bike: null,
    distance: 50000,
    durationMoving: 7200,
    durationRecorded: 7300,
    durationElapsed: 7400,
    altUp: 500,
    altDown: 500,
    powerTotal: 1000000,
    startedAt: '2026-06-26T08:00:00Z',
    startYear: 2026,
    startMonth: 6,
    startDay: 26,
  }

  it('sets source to FIT', () => {
    expect(draftToCreateRequest(draft, 'My Ride', bike).source).toBe('FIT')
  })

  it('includes the full bike object', () => {
    expect(draftToCreateRequest(draft, 'My Ride', bike).bike).toBe(bike)
  })

  it('uses the provided title', () => {
    expect(draftToCreateRequest(draft, 'Custom Title', bike).title).toBe('Custom Title')
  })

  it('copies all draft fields', () => {
    const req = draftToCreateRequest(draft, 'My Ride', bike)
    expect(req.distance).toBe(50000)
    expect(req.durationRecorded).toBe(7300)
    expect(req.durationElapsed).toBe(7400)
  })
})
