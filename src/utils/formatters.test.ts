import { afterEach, describe, expect, it } from 'vitest'
import {
  bikeIdentity,
  componentDisambiguator,
  componentIdentity,
  formatDate,
  formatDateTime,
  formatNumber,
} from './formatters'
import { setFormatProfile } from '@/i18n/formatProfile'
import type { Bike, Component } from '@/types/api'

describe('bikeIdentity', () => {
  it('prefers name when given', () => {
    expect(bikeIdentity({ id: 'b1', name: 'Daily Rider', manufacturer: 'Kocmo', model: 'Daytona' })).toBe(
      'Daily Rider',
    )
  })

  it('falls back to manufacturer + model when name is absent', () => {
    expect(bikeIdentity({ id: 'b1', manufacturer: 'Kocmo', model: 'Daytona' })).toBe('Kocmo Daytona')
  })

  it('falls back to model alone when manufacturer is absent', () => {
    expect(bikeIdentity({ id: 'b1', model: 'Daytona' })).toBe('Daytona')
  })

  it('returns empty string for null/undefined', () => {
    expect(bikeIdentity(null)).toBe('')
    expect(bikeIdentity(undefined)).toBe('')
  })

  it('does not produce a blank row when nothing is set', () => {
    expect(bikeIdentity({ id: 'b1' } as Bike)).toBe('')
  })
})

describe('componentIdentity', () => {
  it('prefers label when given', () => {
    expect(componentIdentity({ label: 'Front tyre', manufacturer: 'Conti', model: 'GP5000' })).toBe(
      'Front tyre',
    )
  })

  it('falls back to manufacturer + model + serial when label is absent', () => {
    expect(
      componentIdentity({ manufacturer: 'Conti', model: 'GP5000', serialNumber: '123' }),
    ).toBe('Conti GP5000 #123')
  })

  it('falls back to serial alone when make/model are absent', () => {
    expect(componentIdentity({ serialNumber: '123' })).toBe('#123')
  })

  it('returns empty string when nothing is set', () => {
    expect(componentIdentity({})).toBe('')
    expect(componentIdentity(null)).toBe('')
  })
})

describe('componentDisambiguator', () => {
  const base: Component = {
    id: 'c1',
    componentTypeId: 'ct1',
    label: 'Front tyre',
  }

  it('joins non-empty attributes in serial, model, manufacturer, purchase date, vendor order', () => {
    expect(
      componentDisambiguator({
        ...base,
        serialNumber: '123',
        model: 'GP5000',
        manufacturer: 'Conti',
        purchaseDate: '2026-01-15',
        vendor: 'BikeShop',
      }),
    ).toBe('#123, GP5000, Conti, 2026-01-15, BikeShop')
  })

  it('omits absent fields', () => {
    expect(componentDisambiguator({ ...base, manufacturer: 'Conti' })).toBe('Conti')
  })

  it('returns empty string for null', () => {
    expect(componentDisambiguator(null)).toBe('')
  })
})

describe('format profile', () => {
  afterEach(() => setFormatProfile('iso'))

  it('formats dates and numbers per profile: iso/de/us', () => {
    setFormatProfile('iso')
    expect(formatDate('2026-01-15')).toBe('2026-01-15')
    expect(formatDateTime('2026-01-15T14:30:00Z')).toMatch(/^2026-01-15 \d{2}:\d{2}$/)
    expect(formatNumber(1234.5)).toBe('1234.5')

    setFormatProfile('de')
    expect(formatDate('2026-01-15')).toBe('15.01.2026')
    expect(formatNumber(1234.5)).toBe('1.234,5')

    setFormatProfile('us')
    expect(formatDate('2026-01-15')).toBe('01/15/2026')
    expect(formatNumber(1234.5)).toBe('1,234.5')
  })
})
