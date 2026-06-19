import { describe, expect, it } from 'vitest'
import { isPartSelectableOn } from './parts'
import type { Part } from '@/types/api'

const makePart = (retiredAt?: string | null): Part => ({ id: 'p1', retiredAt })

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
