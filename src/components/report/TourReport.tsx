import { useState } from 'react'
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { tourReportQuery } from '@/api/reports'
import type { TourGranularity } from '@/types/api'
import { createErrorDisplay } from '@/utils/errors'
import { resolveEndYear, type TourMetric } from './tourChartData'
import { TourReportChart } from './TourReportChart'

const YEARS_BACK_OPTIONS = [1, 2, 3, 5, 10]

export const TourReport = () => {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<TourMetric>('distance')
  const [granularity, setGranularity] = useState<TourGranularity>('month')
  const [endYear, setEndYear] = useState<number | undefined>(undefined)
  const [yearsBack, setYearsBack] = useState(1)

  const { data: report, isLoading, error, refetch } = useQuery(
    tourReportQuery({ granularity, endYear, yearsBack }),
  )

  const errorDisplay = createErrorDisplay(error)
  // Same fallback rule the backend applies server-side, so the first render's
  // axis matches the data the server actually returned for an omitted endYear.
  const resolvedEndYear = resolveEndYear(endYear, report?.availableYears ?? [])

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label={t('report.tours.metricLabel')}
          value={metric}
          onChange={(e) => setMetric(e.target.value as TourMetric)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="distance">{t('report.tours.metricDistance')}</MenuItem>
          <MenuItem value="ascent">{t('report.tours.metricAscent')}</MenuItem>
          <MenuItem value="durationMoving">{t('report.tours.metricDurationMoving')}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label={t('report.tours.granularityLabel')}
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as TourGranularity)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="month">{t('report.tours.granularityMonth')}</MenuItem>
          <MenuItem value="year">{t('report.tours.granularityYear')}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label={t('report.tours.endYearLabel')}
          value={resolvedEndYear ?? ''}
          onChange={(e) => setEndYear(Number(e.target.value))}
          disabled={(report?.availableYears ?? []).length === 0}
          sx={{ minWidth: 110 }}
        >
          {(report?.availableYears ?? []).map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('report.tours.yearsBackLabel')}
          value={yearsBack}
          onChange={(e) => setYearsBack(Number(e.target.value))}
          sx={{ minWidth: 110 }}
        >
          {YEARS_BACK_OPTIONS.map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {errorDisplay && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          }
        >
          {errorDisplay.message}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && !errorDisplay && report && resolvedEndYear === undefined && (
        <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          {t('report.tours.empty')}
        </Box>
      )}

      {!isLoading && !errorDisplay && report && resolvedEndYear !== undefined && (
        <TourReportChart
          report={report}
          granularity={granularity}
          endYear={resolvedEndYear}
          yearsBack={yearsBack}
          metric={metric}
        />
      )}
    </Box>
  )
}
