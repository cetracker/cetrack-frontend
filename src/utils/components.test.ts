import { describe, expect, it } from 'vitest'
import {
  activeMounting,
  buildCorrectMountingBody,
  componentStatusLabel,
  isComponentRetired,
  reuseCandidateComponentIds,
  reuseCandidateMemberComponentIds,
} from './components'
import type { AssemblyMembership, Component, Mounting } from '@/types/api'

describe('isComponentRetired', () => {
  it('is true only when status is retired', () => {
    expect(isComponentRetired({ status: 'retired' } as Component)).toBe(true)
    expect(isComponentRetired({ status: 'mounted' } as Component)).toBe(false)
  })
})

describe('componentStatusLabel', () => {
  it('labels a directly-mounted component "Mounted" (CE-0106)', () => {
    expect(
      componentStatusLabel({ status: 'mounted', directlyMounted: true } as Component),
    ).toBe('Mounted')
  })

  it('disambiguates a governed (via-assembly) mounting as "Mounted (via assembly)"', () => {
    expect(
      componentStatusLabel({ status: 'mounted', directlyMounted: false } as Component),
    ).toBe('Mounted (via assembly)')
    expect(componentStatusLabel({ status: 'mounted' } as Component)).toBe(
      'Mounted (via assembly)',
    )
  })

  it('falls through to the plain status label for non-mounted statuses', () => {
    expect(componentStatusLabel({ status: 'inStock' } as Component)).toBe('In stock')
    expect(componentStatusLabel({ status: 'inAssembly' } as Component)).toBe('In assembly')
    expect(componentStatusLabel({ status: 'retired' } as Component)).toBe('Retired')
  })

  it('returns an empty string when status is absent', () => {
    expect(componentStatusLabel({} as Component)).toBe('')
  })
})

describe('activeMounting', () => {
  it('finds the mounting with no dismountedAt', () => {
    const closed = { id: 'a', dismountedAt: '2026-01-01T00:00:00Z' } as Mounting
    const open = { id: 'b' } as Mounting
    expect(activeMounting([closed, open])).toBe(open)
  })

  it('returns undefined when all mountings are closed', () => {
    const closed = { id: 'a', dismountedAt: '2026-01-01T00:00:00Z' } as Mounting
    expect(activeMounting([closed])).toBeUndefined()
  })
})

describe('buildCorrectMountingBody', () => {
  it('re-open serializes an explicit null dismountedAt', () => {
    const body = buildCorrectMountingBody({ reopen: true })
    expect(JSON.stringify(body)).toContain('"dismountedAt":null')
  })

  it('omits dismountedAt key entirely when untouched', () => {
    const body = buildCorrectMountingBody({ mountedAt: '2026-01-01T00:00:00Z' })
    expect(JSON.stringify(body)).not.toContain('dismountedAt')
    expect('dismountedAt' in body).toBe(false)
  })

  it('reopen wins over an explicit dismountedAt value', () => {
    const body = buildCorrectMountingBody({
      dismountedAt: '2026-02-01T00:00:00Z',
      reopen: true,
    })
    expect(JSON.stringify(body)).toContain('"dismountedAt":null')
  })

  it('sets dismountedAt to the given value when provided without reopen', () => {
    const body = buildCorrectMountingBody({ dismountedAt: '2026-02-01T00:00:00Z' })
    expect(body.dismountedAt).toBe('2026-02-01T00:00:00Z')
  })

  it('omits mountedAt when not provided', () => {
    const body = buildCorrectMountingBody({ reopen: true })
    expect('mountedAt' in body).toBe(false)
  })
})

describe('reuseCandidateComponentIds', () => {
  const closed = (componentId: string, dismountedAt: string): Mounting =>
    ({ id: `${componentId}-${dismountedAt}`, componentId, dismountedAt }) as Mounting
  const open = (componentId: string): Mounting =>
    ({ id: `${componentId}-active`, componentId }) as Mounting

  it('lists each unique component once, most-recently-dismounted first (CE-0011)', () => {
    const mountings = [
      closed('c1', '2026-01-01T00:00:00Z'),
      closed('c1', '2026-03-01T00:00:00Z'),
      closed('c2', '2026-02-01T00:00:00Z'),
    ]
    expect(reuseCandidateComponentIds(mountings)).toEqual(['c1', 'c2'])
  })

  it('excludes the component currently active at this mount point', () => {
    const mountings = [closed('c1', '2026-01-01T00:00:00Z'), open('c1')]
    expect(reuseCandidateComponentIds(mountings)).toEqual([])
  })

  it('returns an empty list when nothing has ever been dismounted here', () => {
    expect(reuseCandidateComponentIds([open('c1')])).toEqual([])
  })
})

describe('reuseCandidateMemberComponentIds', () => {
  const closed = (componentId: string, memberTo: string): AssemblyMembership =>
    ({ id: `${componentId}-${memberTo}`, componentId, memberTo }) as AssemblyMembership
  const open = (componentId: string): AssemblyMembership =>
    ({ id: `${componentId}-active`, componentId }) as AssemblyMembership

  it('lists each unique component once, most-recently-ended first (CE-0105)', () => {
    const memberships = [
      closed('c1', '2026-01-01T00:00:00Z'),
      closed('c1', '2026-03-01T00:00:00Z'),
      closed('c2', '2026-02-01T00:00:00Z'),
    ]
    expect(reuseCandidateMemberComponentIds(memberships)).toEqual(['c1', 'c2'])
  })

  it('excludes the component currently an active member of this slot', () => {
    const memberships = [closed('c1', '2026-01-01T00:00:00Z'), open('c1')]
    expect(reuseCandidateMemberComponentIds(memberships)).toEqual([])
  })

  it('returns an empty list when nothing has ever been a member here', () => {
    expect(reuseCandidateMemberComponentIds([open('c1')])).toEqual([])
  })
})
