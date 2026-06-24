import { describe, expect, it } from 'vitest'
import { allowedActions, buildCommitRequest } from './mytourbookImport'
import type { ExistingTourSummary, ImportCandidate, ImportWarning } from '@/types/api'

const baseCandidate: ImportCandidate = {
  mtTourId: 't1',
  title: 'Tour',
  startedAt: '2026-01-15T08:00:00Z',
  distance: 30_000,
  durationMoving: 5_400,
  bikeId: 'bike-a',
}

const matchedTour = (bikeId?: string): ExistingTourSummary => ({
  tourId: 'existing-1',
  title: 'Old Tour',
  startedAt: '2026-01-15T08:00:00Z',
  distance: 30_000,
  durationMoving: 5_400,
  bikeId,
})

const dupWarning = (
  overrides: Partial<ImportWarning> = {},
): ImportWarning => ({
  type: 'LOGICAL_DUPLICATE',
  mtTourId: 't1',
  message: 'dup',
  incomingCandidate: baseCandidate,
  matchedTours: [matchedTour('bike-b')],
  replaceDisabled: false,
  ...overrides,
})

describe('allowedActions', () => {
  it('returns [] for AMBIGUOUS_BIKE', () => {
    const w: ImportWarning = { type: 'AMBIGUOUS_BIKE', mtTourId: 't1', message: 'ambiguous' }
    expect(allowedActions(w)).toEqual([])
  })

  it('returns [REPLACE, IMPORT_NEW, SUPPRESS] when different bikes, replaceDisabled false', () => {
    expect(allowedActions(dupWarning())).toEqual(['REPLACE', 'IMPORT_NEW', 'SUPPRESS'])
  })

  it('hides IMPORT_NEW when candidate bike matches matched tour bike', () => {
    const w = dupWarning({ matchedTours: [matchedTour('bike-a')] })
    expect(allowedActions(w)).toEqual(['REPLACE', 'SUPPRESS'])
  })

  it('hides REPLACE when replaceDisabled is true', () => {
    const w = dupWarning({
      matchedTours: [matchedTour('bike-b'), matchedTour('bike-c')],
      replaceDisabled: true,
    })
    expect(allowedActions(w)).toEqual(['IMPORT_NEW', 'SUPPRESS'])
  })

  it('returns [SUPPRESS] only when same bike and replaceDisabled', () => {
    const w = dupWarning({ matchedTours: [matchedTour('bike-a')], replaceDisabled: true })
    expect(allowedActions(w)).toEqual(['SUPPRESS'])
  })

  it('hides IMPORT_NEW when candidate bike matches any of multiple matched tours', () => {
    const w = dupWarning({
      matchedTours: [matchedTour('bike-b'), matchedTour('bike-a')],
      replaceDisabled: true,
    })
    expect(allowedActions(w)).toEqual(['SUPPRESS'])
  })
})

describe('buildCommitRequest', () => {
  const c1: ImportCandidate = {
    mtTourId: 'c1',
    title: 'T1',
    startedAt: '2026-01-01T00:00:00Z',
    distance: 10_000,
    durationMoving: 3_600,
  }
  const c2: ImportCandidate = {
    mtTourId: 'c2',
    title: 'T2',
    startedAt: '2026-01-02T00:00:00Z',
    distance: 20_000,
    durationMoving: 7_200,
  }

  it('includes only checked candidates in approvedMtTourIds', () => {
    const result = buildCommitRequest([c1, c2], new Set(['c1']), {})
    expect(result.approvedMtTourIds).toEqual(['c1'])
    expect(result.approvedMtTourIds).not.toContain('c2')
  })

  it('maps resolutions to warningResolutions', () => {
    const result = buildCommitRequest([c1], new Set(['c1']), { w1: 'SUPPRESS' })
    expect(result.warningResolutions).toEqual([{ mtTourId: 'w1', action: 'SUPPRESS' }])
  })

  it('keeps warning and candidate mtTourIds disjoint', () => {
    const result = buildCommitRequest([c1, c2], new Set(['c1', 'c2']), { w1: 'REPLACE' })
    expect(result.approvedMtTourIds).not.toContain('w1')
    expect(result.warningResolutions?.map((r) => r.mtTourId)).not.toContain('c1')
    expect(result.warningResolutions?.map((r) => r.mtTourId)).not.toContain('c2')
  })

  it('emits empty warningResolutions when none resolved', () => {
    const result = buildCommitRequest([c1], new Set(['c1']), {})
    expect(result.warningResolutions).toEqual([])
  })

  it('emits empty approvedMtTourIds when nothing checked', () => {
    const result = buildCommitRequest([c1, c2], new Set(), { w1: 'SUPPRESS' })
    expect(result.approvedMtTourIds).toEqual([])
  })
})
