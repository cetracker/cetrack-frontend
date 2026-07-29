import { describe, expect, it } from 'vitest'
import type { TourReport } from '@/types/api'
import { buildAxis, buildChartData, resolveEndYear, shareOfBucket } from './tourChartData'

describe('resolveEndYear', () => {
  it('uses the explicit endYear when given', () => {
    expect(resolveEndYear(2023, [2025, 2024])).toBe(2023)
  })

  it('falls back to the newest available year when omitted', () => {
    expect(resolveEndYear(undefined, [2025, 2024])).toBe(2025)
  })

  it('is undefined when availableYears is empty', () => {
    expect(resolveEndYear(undefined, [])).toBeUndefined()
  })
})

describe('buildAxis', () => {
  it('produces yearsBack x 12 ordered month buckets', () => {
    const axis = buildAxis('month', 2024, 2)
    expect(axis).toHaveLength(24)
    expect(axis[0]).toEqual({ year: 2023, month: 1 })
    expect(axis[11]).toEqual({ year: 2023, month: 12 })
    expect(axis[12]).toEqual({ year: 2024, month: 1 })
    expect(axis[23]).toEqual({ year: 2024, month: 12 })
  })

  it('produces yearsBack ordered year buckets with no month', () => {
    const axis = buildAxis('year', 2024, 3)
    expect(axis).toEqual([{ year: 2022 }, { year: 2023 }, { year: 2024 }])
  })
})

describe('buildChartData', () => {
  const report: TourReport = {
    availableYears: [2024],
    bikes: [
      { bikeId: 'bike-a', bikeName: 'Alpha' },
      { bikeModel: 'Model-only' },
    ],
    buckets: [
      {
        year: 2024,
        month: 1,
        items: [
          { bikeId: 'bike-a', distance: 10_000, ascent: 100, durationMoving: 3600 },
        ],
      },
      {
        year: 2024,
        month: 2,
        items: [
          { bikeId: 'bike-a', distance: 5_000, ascent: 50, durationMoving: 1800 },
          { distance: 2_000, ascent: 20, durationMoving: 600 },
        ],
      },
    ],
  }

  it('zero-fills and aligns per-bike series to the axis', () => {
    const axis = buildAxis('month', 2024, 1)
    const { xKeys, series } = buildChartData(report, axis, 'distance', 'Unassigned')

    expect(xKeys).toHaveLength(12)
    const alpha = series.find((s) => s.bikeId === 'bike-a')!
    expect(alpha.data[0]).toBe(10_000)
    expect(alpha.data[1]).toBe(5_000)
    expect(alpha.data[2]).toBe(0)
  })

  it('falls back to model when name is absent, and to the passed label when both are absent', () => {
    const axis = buildAxis('month', 2024, 1)
    const { series } = buildChartData(report, axis, 'distance', 'Unassigned')

    expect(series.find((s) => s.bikeId === undefined)!.label).toBe('Model-only')
  })

  it('labels a bike-less series with the passed unassigned label', () => {
    const withUnassigned: TourReport = {
      availableYears: [2024],
      bikes: [{ bikeId: 'bike-a', bikeName: 'Alpha' }, {}],
      buckets: [
        {
          year: 2024,
          month: 1,
          items: [{ distance: 1_000, ascent: 0, durationMoving: 60 }],
        },
      ],
    }
    const axis = buildAxis('month', 2024, 1)
    const { series } = buildChartData(withUnassigned, axis, 'distance', 'Unassigned')

    expect(series.at(-1)!.label).toBe('Unassigned')
    expect(series.at(-1)!.data[0]).toBe(1_000)
  })

  it('computes bucketTotals summing all bikes in the bucket', () => {
    const axis = buildAxis('month', 2024, 1)
    const { bucketTotals } = buildChartData(report, axis, 'distance', 'Unassigned')

    expect(bucketTotals[0]).toBe(10_000)
    expect(bucketTotals[1]).toBe(7_000)
  })

  it('ignores buckets outside the axis window', () => {
    const outOfWindow: TourReport = {
      availableYears: [2020, 2024],
      bikes: [{ bikeId: 'bike-a', bikeName: 'Alpha' }],
      buckets: [
        { year: 2020, month: 1, items: [{ bikeId: 'bike-a', distance: 999, ascent: 0, durationMoving: 0 }] },
      ],
    }
    const axis = buildAxis('month', 2024, 1)
    const { bucketTotals } = buildChartData(outOfWindow, axis, 'distance', 'Unassigned')

    expect(bucketTotals.every((t) => t === 0)).toBe(true)
  })
})

describe('shareOfBucket', () => {
  it('computes the fraction of the total', () => {
    expect(shareOfBucket(25, 100)).toBe(0.25)
  })

  it('is zero when the total is zero', () => {
    expect(shareOfBucket(0, 0)).toBe(0)
  })
})
