import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { bikesQuery } from '@/api/bikes'
import { createTour, toursQueryKey } from '@/api/tours'
import { isApiError } from '@/api/client'
import { BikeSelect } from '@/components/common/BikeSelect'
import { useApiMutation } from '@/hooks/useApiMutation'
import type { FitDraftTour } from '@/types/api'
import { formatDate, formatDistanceKm, formatDuration, formatKJ, bikeName } from '@/utils/formatters'
import { draftToCreateRequest, suggestTitle } from '@/utils/fitImport'

type DraftStatus = 'editing' | 'creating' | 'created' | 'error'

const FitDraftCard = ({ draft }: { draft: FitDraftTour }) => {
  const qc = useQueryClient()
  const { data: bikes } = useQuery(bikesQuery())
  const bikeMap = new Map((bikes ?? []).map((b) => [b.id, b]))

  const [title, setTitle] = useState(() => suggestTitle(draft.startedAt, draft.distance))
  const [bikeId, setBikeId] = useState<string | null>(null)
  const [status, setStatus] = useState<DraftStatus>('editing')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMut = useApiMutation(createTour, {
    notifyOnError: false,
    onSuccess: () => {
      setStatus('created')
      void qc.invalidateQueries({ queryKey: toursQueryKey })
    },
    onError: (err) => {
      setStatus('error')
      setErrorMsg(
        isApiError(err) && err.status === 409
          ? 'A tour for this bike already exists'
          : (err.message ?? 'Unexpected error'),
      )
    },
  })

  const handleCreate = () => {
    if (!title.trim() || !bikeId || status === 'creating' || status === 'created') return
    const bike = bikeMap.get(bikeId)
    if (!bike) return
    setStatus('creating')
    setErrorMsg(null)
    createMut.mutate(draftToCreateRequest(draft, title.trim(), bike))
  }

  const dateStr = `${draft.startYear}-${String(draft.startMonth).padStart(2, '0')}-${String(draft.startDay).padStart(2, '0')}`

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="body2">{dateStr}</Typography>
          <Typography variant="body2">{formatDistanceKm(draft.distance)} km</Typography>
          <Typography variant="body2">{formatDuration(draft.durationMoving)}</Typography>
          {draft.altUp > 0 && <Typography variant="body2">↑{draft.altUp} m</Typography>}
          {draft.altDown > 0 && <Typography variant="body2">↓{draft.altDown} m</Typography>}
          {draft.powerTotal > 0 && (
            <Typography variant="body2">{formatKJ(draft.powerTotal)} kJ</Typography>
          )}
        </Stack>

        {draft.duplicateHint && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Possible duplicate — matching tours already exist:
            </Typography>
            {draft.duplicateHint.matchedTours.map((t) => {
              const bike = t.bikeId ? bikeMap.get(t.bikeId) : undefined
              const bikeLabel = bike ? bikeName(bike) : '—'
              return (
                <Typography key={t.tourId} variant="body2">
                  {t.title} · {formatDate(t.startedAt)} · {bikeLabel}
                </Typography>
              )
            })}
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              Create anyway if this was a different bike.
            </Typography>
          </Alert>
        )}

        {status === 'created' ? (
          <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography color="success.main">✓ Created</Typography>
          </Stack>
        ) : (
          <Stack sx={{ gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={(e) => e.target.select()}
              required
              fullWidth
              disabled={status === 'creating'}
              size="small"
            />
            <BikeSelect
              value={bikeId}
              onChange={(id) => setBikeId(id)}
              includeNone={false}
              includeFromFile={false}
              required
              size="small"
            />
            {status === 'error' && errorMsg && (
              <Alert severity="error">{errorMsg}</Alert>
            )}
            <Box>
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={!title.trim() || !bikeId || status === 'creating'}
              >
                Create
              </Button>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

interface FitImportReviewProps {
  drafts: FitDraftTour[]
}

export const FitImportReview = ({ drafts }: FitImportReviewProps) => {
  if (drafts.length === 0) {
    return <Alert severity="warning">No sessions found in this FIT file.</Alert>
  }
  return (
    <Stack sx={{ gap: 2 }}>
      {drafts.map((draft, i) => (
        <FitDraftCard key={`${draft.startedAt}-${i}`} draft={draft} />
      ))}
    </Stack>
  )
}
