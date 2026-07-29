import type { TourGranularity, TourReport } from '@/types/api'

export type TourMetric = 'distance' | 'ascent' | 'durationMoving'

export interface AxisBucket {
  year: number
  month?: number
}

export interface TourChartSeries {
  bikeId?: string
  label: string
  data: number[]
}

export interface TourChartData {
  xKeys: string[]
  series: TourChartSeries[]
  bucketTotals: number[]
}

const bucketKey = (b: AxisBucket): string =>
  b.month != null ? `${b.year}-${String(b.month).padStart(2, '0')}` : `${b.year}`

/** endYear defaults to the newest year with tours - the same rule the
 *  backend applies server-side - so first render matches the fetched data. */
export const resolveEndYear = (
  endYear: number | undefined,
  availableYears: number[],
): number | undefined => endYear ?? availableYears[0]

export const buildAxis = (
  granularity: TourGranularity,
  endYear: number,
  yearsBack: number,
): AxisBucket[] => {
  const startYear = endYear - yearsBack + 1
  const years = Array.from({ length: yearsBack }, (_, i) => startYear + i)
  if (granularity === 'year') return years.map((year) => ({ year }))
  return years.flatMap((year) =>
    Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 })),
  )
}

export const buildChartData = (
  report: TourReport,
  axis: AxisBucket[],
  metric: TourMetric,
  unassignedLabel: string,
): TourChartData => {
  const xKeys = axis.map(bucketKey)
  const indexByKey = new Map(xKeys.map((key, i) => [key, i]))

  const series: TourChartSeries[] = report.bikes.map((bike) => ({
    bikeId: bike.bikeId,
    label: bike.bikeName || bike.bikeModel || unassignedLabel,
    data: new Array<number>(axis.length).fill(0),
  }))
  const seriesByBikeId = new Map(series.map((s) => [s.bikeId, s]))
  const bucketTotals = new Array<number>(axis.length).fill(0)

  for (const bucket of report.buckets) {
    const index = indexByKey.get(bucketKey({ year: bucket.year, month: bucket.month }))
    if (index === undefined) continue
    for (const item of bucket.items) {
      const value = item[metric]
      const series = seriesByBikeId.get(item.bikeId)
      if (series) series.data[index] = value
      bucketTotals[index] += value
    }
  }

  return { xKeys, series, bucketTotals }
}

export const shareOfBucket = (value: number, total: number): number =>
  total === 0 ? 0 : value / total
