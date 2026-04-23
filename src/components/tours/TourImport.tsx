import { useRef, useState } from 'react'
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
import styled from '@emotion/styled'
import { useQueryClient } from '@tanstack/react-query'
import { importTours, toursQueryKey } from '@/api/tours'
import type { MTTour } from '@/types/api'
import { BikeSelect } from '@/components/common/BikeSelect'
import { formatDistanceKm } from '@/utils/formatters'
import { useApiMutation } from '@/hooks/useApiMutation'

const DropZone = styled.label<{ $active: boolean; $error: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  border: 2px dashed
    ${({ $active, $error }) =>
      $error ? '#d32f2f' : $active ? '#00897B' : '#90a4ae'};
  background: ${({ $active }) =>
    $active ? 'rgba(0, 137, 123, 0.08)' : 'transparent'};
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 120ms ease-in-out;
  input {
    display: none;
  }
`

const SQL_SAMPLE = `SELECT TOURID AS MTTOURID, STARTYEAR, STARTMONTH, STARTDAY,
  TOURTITLE AS TITLE, TOURSTARTTIME AS STARTTIMESTAMP,
  TOURDISTANCE AS DISTANCE, TOURALTUP, TOURALTDOWN,
  POWER_TOTALWORK AS POWERTOTAL, TOURDEVICETIME_ELAPSED AS TIMEELAPSEDDEVICE,
  TOURCOMPUTEDTIME_MOVING AS DURATIONMOVING, TOURDEVICETIME_RECORDED AS TIMERECORDEDDEVICE
FROM "USER".TOURDATA
WHERE STARTYEAR=2024 AND TOURPERSON_PERSONID=0 AND TOURTYPE_TYPEID=0`

const validateTours = (parsed: unknown): MTTour[] => {
  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array of tours.')
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
  const qc = useQueryClient()
  const [fileName, setFileName] = useState<string | null>(null)
  const [tours, setTours] = useState<MTTour[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [bikeId, setBikeId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const importMut = useApiMutation(importTours, {
    successMessage: 'Tours imported',
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: toursQueryKey })
      reset()
    },
  })

  const reset = () => {
    setTours(null)
    setFileName(null)
    setError(null)
    setBikeId(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const readFile = async (file: File) => {
    setFileName(file.name)
    setError(null)
    setTours(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const validated = validateTours(parsed)
      setTours(validated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void readFile(file)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void readFile(file)
  }

  const submit = () => {
    if (!tours) return
    const payload = bikeId ? tours.map((t) => ({ ...t, bikeId })) : tours
    importMut.mutate(payload)
  }

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography variant="h5" gutterBottom>
        Import Tours
      </Typography>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Export Instructions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            Open the MyTourBook Derby database in DBeaver and run the following
            query. Export the result as JSON, then drop the file below.
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

      <DropZone
        $active={dragging}
        $error={!!error}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={onChange}
        />
        <CloudUploadIcon sx={{ fontSize: 44, color: 'text.secondary' }} />
        <Typography variant="body1" sx={{ mt: 1 }}>
          {fileName ? fileName : 'Drop a JSON file here or click to select'}
        </Typography>
        {fileName && !error && tours && (
          <Typography variant="body2" color="success.main">
            {tours.length} tour{tours.length === 1 ? '' : 's'} ready to import
          </Typography>
        )}
      </DropZone>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reset}>
              Reset
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {tours && (
        <Box sx={{ mt: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mb: 2 }}
          >
            <Box sx={{ minWidth: 240 }}>
              <BikeSelect
                value={bikeId}
                onChange={setBikeId}
                label="Assign to bike (optional)"
                noneLabel="— no assignment —"
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
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={submit}
              disabled={importMut.isPending || tours.length === 0}
            >
              Upload {tours.length} tour{tours.length === 1 ? '' : 's'}
            </Button>
          </Stack>

          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell align="right">Distance (km)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tours.map((t) => (
                  <TableRow key={t.MTTOURID}>
                    <TableCell>{previewDate(t)}</TableCell>
                    <TableCell>{t.TITLE}</TableCell>
                    <TableCell align="right">
                      {formatDistanceKm(t.DISTANCE)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
