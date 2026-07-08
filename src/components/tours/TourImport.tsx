import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { importTours, parseFit, toursQueryKey } from '@/api/tours'
import type { Bike, FitDraftTour, MTTour } from '@/types/api'
import { BikeSelect, FROM_FILE } from '@/components/common/BikeSelect'
import { bikeIdentity, formatDistanceKm } from '@/utils/formatters'
import { useApiMutation } from '@/hooks/useApiMutation'
import { bikesQuery } from '@/api/bikes'
import { FitImportReview } from './FitImportReview'
import TourDropZone from './TourDropZone'

const SQL_SAMPLE = `Deprecated - Needs adoption! SELECT TOURID AS MTTOURID, STARTYEAR, STARTMONTH, STARTDAY,
  TOURTITLE AS TITLE, TOURSTARTTIME AS STARTTIMESTAMP,
  TOURDISTANCE AS DISTANCE, TOURALTUP, TOURALTDOWN,
  POWER_TOTALWORK AS POWERTOTAL, TOURDEVICETIME_ELAPSED AS TIMEELAPSEDDEVICE,
  TOURCOMPUTEDTIME_MOVING AS DURATIONMOVING, TOURDEVICETIME_RECORDED AS TIMERECORDEDDEVICE
FROM "USER".TOURDATA
WHERE STARTYEAR=2024 AND TOURPERSON_PERSONID=0 AND TOURTYPE_TYPEID=0`

const validateTours = (parsed: unknown): MTTour[] => {
  if (!Array.isArray(parsed)) {
    throw new TypeError('Expected a JSON array of tours.')
  }
  parsed.forEach((t, i) => {
    if (!t || typeof t !== 'object')
      throw new Error(`Entry ${i + 1} is not an object.`)
    const o = t as Record<string, unknown>
    const required = [
      'MTTOURID',
      'TITLE',
      'DISTANCE',
      'DURATIONMOVING',
      'TOURALTUP',
      'TOURALTDOWN',
      'POWERTOTAL',
      'STARTYEAR',
      'STARTMONTH',
      'STARTDAY',
      'STARTTIMESTAMP',
    ]
    const missing = required.filter((k) => o[k] == null)
    if (missing.length > 0)
      throw new Error(`Entry ${i + 1} missing: ${missing.join(', ')}.`)
  })
  return parsed as MTTour[]
}

const previewDate = (t: MTTour): string =>
  `${t.STARTYEAR}-${String(t.STARTMONTH).padStart(2, '0')}-${String(
    t.STARTDAY,
  ).padStart(2, '0')}`

export const TourImport = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [fileName, setFileName] = useState<string | null>(null)
  const [tours, setTours] = useState<MTTour[] | null>(null)
  const [fitDrafts, setFitDrafts] = useState<FitDraftTour[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [bikeId, setBikeId] = useState<string | null>(null)
  const [bikeError, setBikeError] = useState(false)

  const { data: bikes } = useQuery(bikesQuery())
  const bikeMap: Map<string, Bike> = new Map((bikes ?? []).map((b) => [b.id, b]))

  const hasBikeIds = tours?.some((t) => !!t.BIKEID) ?? false
  const allMatched =
    hasBikeIds && (tours ?? []).every((t) => bikeMap.has(t.BIKEID ?? ''))

   const importMut = useApiMutation(importTours, {
     successMessage: t('import.page.importedSuccess'),
     onSuccess: async () => {
       await qc.invalidateQueries({ queryKey: toursQueryKey })
       reset()
     },
   })

  const reset = () => {
    setTours(null)
    setFitDrafts(null)
    setFileName(null)
    setError(null)
    setBikeId(null)
    setBikeError(false)
    setResetKey((k) => k + 1)
  }

  const handleJsonFile = async (file: File) => {
    setFileName(file.name)
    setError(null)
    setTours(null)
    setFitDrafts(null)
    setBikeId(null)
    setBikeError(false)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const validated = validateTours(parsed)
      setTours([...validated].sort((a, b) => a.STARTTIMESTAMP - b.STARTTIMESTAMP))
      if (validated.some((t) => !!t.BIKEID)) {
        setBikeId(FROM_FILE)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('import.page.invalidJson'))
    }
  }

  const handleFitFile = async (file: File) => {
    setFileName(file.name)
    setError(null)
    setTours(null)
    setFitDrafts(null)
    setBikeId(null)
    setBikeError(false)
    try {
      const drafts = await parseFit(file)
      setFitDrafts(drafts)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('import.page.failedParseFit'))
    }
  }

  const handleFile = (file: File) => {
    if (file.name.toLowerCase().endsWith('.fit')) {
      void handleFitFile(file)
    } else {
      void handleJsonFile(file)
    }
  }

  const submit = () => {
    if (!tours) return
    if (hasBikeIds) {
      if (!allMatched) return
      importMut.mutate(tours.map((t) => ({ ...t, bikeId: t.BIKEID })))
    } else {
      if (!bikeId) {
        setBikeError(true)
        return
      }
      importMut.mutate(tours.map((t) => ({ ...t, bikeId })))
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {t('import.page.title')}
      </Typography>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{t('import.page.exportInstructionsTitle')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('import.page.exportInstructionsBody')}
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              fontFamily: 'monospace',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
            }}
          >
            {SQL_SAMPLE}
          </Paper>
        </AccordionDetails>
      </Accordion>

      <TourDropZone key={resetKey} onFileSelect={handleFile} />

      {fileName && !error && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {fileName}
          </Typography>
          {tours && (
            <Typography variant="body2" color="success.main">
              {t('import.page.toursReady', { count: tours.length })}
            </Typography>
          )}
          {fitDrafts && (
            <Typography variant="body2" color="success.main">
              {t('import.page.sessionsParsed', { count: fitDrafts.length })}
            </Typography>
          )}
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reset}>
              {t('import.page.resetButton')}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

       {fitDrafts && (
        <Box sx={{ mt: 3 }}>
          <Stack
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
              mb: 2,
            }}
          >
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<DeleteIcon />}
              onClick={reset}
            >
              {t('import.page.clearButton')}
            </Button>
          </Stack>
          <FitImportReview drafts={fitDrafts} />
        </Box>
      )}

      {tours && (
         <Box sx={{ mt: 3 }}>
           <Stack
             sx={{
               flexDirection: { xs: 'column', sm: 'row' },
               gap: 2,
               alignItems: { xs: 'stretch', sm: 'center' },
               mb: 2,
             }}
           >
            <Box sx={{ minWidth: 240 }}>
              <BikeSelect
                value={hasBikeIds ? FROM_FILE : bikeId}
                onChange={(id) => { setBikeId(id); setBikeError(false) }}
                includeNone={false}
                includeFromFile={hasBikeIds}
                disabled={hasBikeIds}
                label={t('common.bike')}
                required={!hasBikeIds}
                error={bikeError}
                helperText={bikeError ? t('import.page.pleaseSelectBike') : undefined}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<DeleteIcon />}
              onClick={reset}
              disabled={importMut.isPending}
            >
              {t('import.page.clearButton')}
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={submit}
              disabled={
                importMut.isPending ||
                tours.length === 0 ||
                (hasBikeIds ? !allMatched : !bikeId)
              }
            >
              {t('import.page.uploadButton', { count: tours.length })}
            </Button>
          </Stack>

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{t('import.page.dateHeader')}</TableCell>
                  <TableCell>{t('tours.list.columns.title')}</TableCell>
                  <TableCell align="right">{t('tours.list.columns.distance')}</TableCell>
                  {hasBikeIds && <TableCell>{t('import.page.bikeFileHeader')}</TableCell>}
                  {hasBikeIds && <TableCell>{t('import.page.bikeCetrackerHeader')}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {tours.map((tour) => {
                  const matched = tour.BIKEID ? bikeMap.get(tour.BIKEID) : undefined
                  const noMatch = hasBikeIds && !matched
                  return (
                    <TableRow key={tour.MTTOURID}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{previewDate(tour)}</TableCell>
                      <TableCell>{tour.TITLE}</TableCell>
                      <TableCell align="right">
                        {formatDistanceKm(tour.DISTANCE)}
                      </TableCell>
                      {hasBikeIds && (
                        <TableCell>
                          {tour.BIKENAME?.split('\n')[0].trim() ?? '—'}
                        </TableCell>
                      )}
                      {hasBikeIds && (
                        <TableCell
                          sx={noMatch ? { color: 'error.main', fontWeight: 600 } : undefined}
                        >
                          {matched ? bikeIdentity(matched) : t('import.page.noMatch')}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
