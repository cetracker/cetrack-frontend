import { describe, expect, it } from 'vitest'
import { isPartRetired, isPartSelectableOn, reuseIconKeys } from './parts'
import type { Part, PartPartTypeRelation } from '@/types/api'

const makePart = (retiredAt?: string | null): Part => ({ id: 'p1', retiredAt })

const makeRelation = (
  partId: string,
  validFrom: string,
  validUntil?: string | null,
): PartPartTypeRelation =>
  ({ partId, validFrom, validUntil }) as unknown as PartPartTypeRelation

describe('isPartSelectableOn', () => {
  const validFrom = new Date('2026-04-22T00:00:00.000+02:00')

  it('keeps a part with no retiredAt', () => {
    expect(isPartSelectableOn(makePart(), validFrom)).toBe(true)
  })

  it('keeps a part retired after validFrom', () => {
    expect(isPartSelectableOn(makePart('2026-04-22T14:00:00.000+02:00'), validFrom)).toBe(true)
  })

  it('drops a part retired at the same instant as validFrom', () => {
    expect(isPartSelectableOn(makePart('2026-04-22T00:00:00.000+02:00'), validFrom)).toBe(false)
  })

  it('drops a part retired before validFrom', () => {
    expect(isPartSelectableOn(makePart('2026-04-21T00:00:00.000+02:00'), validFrom)).toBe(false)
  })
})

describe('isPartRetired', () => {
  const asOf = new Date('2026-06-19T00:00:00.000+02:00')

  it('is false when no retiredAt', () => {
    expect(isPartRetired(makePart(), asOf)).toBe(false)
  })

  it('is true when retired before asOf', () => {
    expect(isPartRetired(makePart('2026-01-01T00:00:00.000+02:00'), asOf)).toBe(true)
  })

  it('is false when retirement is scheduled after asOf', () => {
    expect(isPartRetired(makePart('2026-12-01T00:00:00.000+02:00'), asOf)).toBe(false)
  })
})

describe('reuseIconKeys', () => {
  it('returns empty set for no relations', () => {
    expect(reuseIconKeys([])).toEqual(new Set())
  })

  it('includes the row key for a single inactive part', () => {
    const r = makeRelation('p1', '2026-01-01', '2026-06-01')
    expect(reuseIconKeys([r])).toEqual(new Set(['p1-2026-01-01']))
  })

  it('includes only the most-recent inactive row when a part appears multiple times', () => {
    // sorted descending: newer first
    const newer = makeRelation('p1', '2026-03-01', '2026-05-01')
    const older = makeRelation('p1', '2026-01-01', '2026-02-01')
    const keys = reuseIconKeys([newer, older])
    expect(keys.has('p1-2026-03-01')).toBe(true)
    expect(keys.has('p1-2026-01-01')).toBe(false)
  })

  it('excludes a part that currently has an active relation', () => {
    const active = makeRelation('p1', '2026-06-01', null)
    const inactive = makeRelation('p1', '2026-01-01', '2026-05-31')
    expect(reuseIconKeys([active, inactive])).toEqual(new Set())
  })

  it('includes each distinct inactive part once', () => {
    const a = makeRelation('p1', '2026-03-01', '2026-05-01')
    const b = makeRelation('p2', '2026-04-01', '2026-06-01')
    const keys = reuseIconKeys([b, a])
    expect(keys).toEqual(new Set(['p1-2026-03-01', 'p2-2026-04-01']))
  })
})
