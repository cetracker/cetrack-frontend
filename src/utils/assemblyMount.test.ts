import { describe, expect, it } from 'vitest'
import { blockingSlots, buildSlotResolutions, canSubmitMount, unresolvedSlots } from './assemblyMount'
import type { MountPlan, PlannedSlot } from '@/types/api'

const slot = (overrides: Partial<PlannedSlot>): PlannedSlot => ({
  slotId: 's1',
  state: 'resolved',
  ...overrides,
})

const plan = (slots: PlannedSlot[]): MountPlan => ({
  assemblyId: 'a1',
  bikeId: 'b1',
  at: '2026-01-01T00:00:00Z',
  mountable: true,
  slots,
})

describe('unresolvedSlots', () => {
  it('filters to only unresolved-state slots', () => {
    const p = plan([
      slot({ slotId: 's1', state: 'resolved' }),
      slot({ slotId: 's2', state: 'unresolved' }),
    ])
    expect(unresolvedSlots(p).map((s) => s.slotId)).toEqual(['s2'])
  })
})

describe('blockingSlots', () => {
  it('includes both impossible and empty slots', () => {
    const p = plan([
      slot({ slotId: 's1', state: 'impossible' }),
      slot({ slotId: 's2', state: 'empty' }),
      slot({ slotId: 's3', state: 'resolved' }),
    ])
    expect(blockingSlots(p).map((s) => s.slotId).sort()).toEqual(['s1', 's2'])
  })
})

describe('buildSlotResolutions', () => {
  it('excludes a stray answer keyed to a resolved slot', () => {
    const p = plan([
      slot({ slotId: 's1', state: 'resolved' }),
      slot({ slotId: 's2', state: 'unresolved' }),
    ])
    const answers = { s1: 'mp-stray', s2: 'mp2' }
    expect(buildSlotResolutions(p, answers)).toEqual([{ slotId: 's2', mountPointId: 'mp2' }])
  })

  it('includes only answered unresolved slots', () => {
    const p = plan([
      slot({ slotId: 's1', state: 'unresolved' }),
      slot({ slotId: 's2', state: 'unresolved' }),
    ])
    const answers = { s2: 'mp2' }
    expect(buildSlotResolutions(p, answers)).toEqual([{ slotId: 's2', mountPointId: 'mp2' }])
  })
})

describe('canSubmitMount', () => {
  it('is false with any impossible slot regardless of answers', () => {
    const p = plan([slot({ slotId: 's1', state: 'impossible' })])
    expect(canSubmitMount(p, {})).toBe(false)
  })

  it('is false with any empty slot regardless of answers', () => {
    const p = plan([slot({ slotId: 's1', state: 'empty' })])
    expect(canSubmitMount(p, {})).toBe(false)
  })

  it('is false with an unanswered unresolved slot', () => {
    const p = plan([slot({ slotId: 's1', state: 'unresolved' })])
    expect(canSubmitMount(p, {})).toBe(false)
  })

  it('is false for an empty plan', () => {
    const p = plan([])
    expect(canSubmitMount(p, {})).toBe(false)
  })

  it('is true when every unresolved slot is answered and no blocking slot exists', () => {
    const p = plan([
      slot({ slotId: 's1', state: 'resolved' }),
      slot({ slotId: 's2', state: 'unresolved' }),
    ])
    expect(canSubmitMount(p, { s2: 'mp2' })).toBe(true)
  })

  it('is true for an all-resolved plan with an empty answers object', () => {
    const p = plan([slot({ slotId: 's1', state: 'resolved' })])
    expect(canSubmitMount(p, {})).toBe(true)
  })
})
