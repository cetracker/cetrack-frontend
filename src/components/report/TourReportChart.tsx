import { useMemo } from 'react'
import { useTheme } from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { blueberryTwilightPalette } from '@mui/x-charts/colorPalettes'
import { useTranslation } from 'react-i18next'
import type { TourGranularity, TourReport } from '@/types/api'
import { formatDistanceKm, formatDuration, formatMonthShort, formatNumber } from '@/utils/formatters'
import {
  buildAxis,
  buildChartData,
  shareOfBucket,
  type AxisBucket,
  type TourMetric,
} from './tourChartData'

const formatMetricValue = (metric: TourMetric, value: number): string => {
  switch (metric) {
    case 'distance':
      return `${formatDistanceKm(value)} km`
    case 'ascent':
      return `${formatNumber(value)} m`
    case 'durationMoving':
      return formatDuration(value)
  }
}

const formatBucketLabel = (bucket: AxisBucket, showYear: boolean): string =>
  bucket.month != null
    ? showYear
      ? `${formatMonthShort(bucket.month)} ${String(bucket.year).slice(-2)}`
      : formatMonthShort(bucket.month)
    : String(bucket.year)

interface Props {
  report: TourReport
  granularity: TourGranularity
  endYear: number
  yearsBack: number
  metric: TourMetric
}

export const TourReportChart = ({ report, granularity, endYear, yearsBack, metric }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()

  const axis = useMemo(
    () => buildAxis(granularity, endYear, yearsBack),
    [granularity, endYear, yearsBack],
  )
  const unassignedLabel = t('report.tours.unassigned')
  const { xKeys, series, bucketTotals } = useMemo(
    () => buildChartData(report, axis, metric, unassignedLabel),
    [report, axis, metric, unassignedLabel],
  )

  const showYearInLabel = yearsBack > 1 && granularity === 'month'

  return (
    <BarChart
      height={400}
      colors={blueberryTwilightPalette}
      series={series.map((s) => ({
        id: s.bikeId ?? 'unassigned',
        label: s.label,
        data: s.data,
        stack: 'total',
        ...(s.bikeId === undefined ? { color: theme.palette.grey[500] } : {}),
        valueFormatter: (value: number | null, { dataIndex }: { dataIndex: number }) => {
          if (value == null) return null
          const total = bucketTotals[dataIndex]
          const share = Math.round(shareOfBucket(value, total) * 100)
          return `${formatMetricValue(metric, value)} (${share} %)`
        },
      }))}
      xAxis={[
        {
          scaleType: 'band',
          data: xKeys,
          valueFormatter: (value: string, context: { location: string }) => {
            const index = xKeys.indexOf(value)
            const label = formatBucketLabel(axis[index], showYearInLabel)
            if (context.location === 'tooltip') {
              return `${label} — ${t('report.tours.total')}: ${formatMetricValue(metric, bucketTotals[index])}`
            }
            return label
          },
        },
      ]}
    />
  )
}
