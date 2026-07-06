import { describe, expect, it } from 'vitest'
import {
  activeMounting,
  buildCorrectMountingBody,
  isComponentRetired,
} from './components'
import type { Component, Mounting } from '@/types/api'

describe('isComponentRetired', () => {
  it('is true only when status is retired', () => {
    expect(isComponentRetired({ status: 'retired' } as Component)).toBe(true)
    expect(isComponentRetired({ status: 'mounted' } as Component)).toBe(false)
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
