import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { bikesQuery } from '@/api/bikes'
import {
  commitMyTourbookImport,
  pendingMyTourbookSessionQuery,
  pendingMyTourbookSessionQueryKey,
} from '@/api/tours'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import type {
  CommitImportRequest,
  ExistingTourSummary,
  ImportCandidate,
  ImportWarning,
  WarningResolutionAction,
} from '@/types/api'
import { bikeName, formatDateTime, formatDistanceKm, formatDuration } from '@/utils/formatters'
import { allowedActions, buildCommitRequest } from '@/utils/mytourbookImport'

// --- CandidateList -----------------------------------------------------------

interface CandidateListProps {
  candidates: ImportCandidate[]
  checked: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  bikeLabel: (id?: string) => string
}

const CandidateList = ({ candidates, checked, onToggle, onToggleAll, bikeLabel }: CandidateListProps) => {
  const allChecked = candidates.length > 0 && candidates.every((c) => checked.has(c.mtTourId))
  const someChecked = candidates.some((c) => checked.has(c.mtTourId))

  return (
    <Paper>
      <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
        Candidates ({candidates.length})
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allChecked}
                indeterminate={someChecked && !allChecked}
                onChange={onToggleAll}
                aria-label="select all"
              />
            </TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Distance</TableCell>
            <TableCell align="right">Duration</TableCell>
            <TableCell>Bike</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {candidates.map((c) => (
            <TableRow key={c.mtTourId}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={checked.has(c.mtTourId)}
                  onChange={() => onToggle(c.mtTourId)}
                />
              </TableCell>
              <TableCell>{c.title}</TableCell>
              <TableCell>{formatDateTime(c.startedAt)}</TableCell>
              <TableCell align="right">{formatDistanceKm(c.distance)} km</TableCell>
              <TableCell align="right">{formatDuration(c.durationMoving)}</TableCell>
              <TableCell>{bikeLabel(c.bikeId)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

// --- TourComparisonTable -----------------------------------------------------

interface TourComparisonTableProps {
  existing: ExistingTourSummary
  incoming: ImportCandidate
  bikeLabel: (id?: string) => string
}

const TourComparisonTable = ({ existing, incoming, bikeLabel }: TourComparisonTableProps) => (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell />
        <TableCell>Existing</TableCell>
        <TableCell>Incoming</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>Title</TableCell>
        <TableCell>{existing.title}</TableCell>
        <TableCell>{incoming.title}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell>{formatDateTime(existing.startedAt)}</TableCell>
        <TableCell>{formatDateTime(incoming.startedAt)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Distance</TableCell>
        <TableCell>{formatDistanceKm(existing.distance)} km</TableCell>
        <TableCell>{formatDistanceKm(incoming.distance)} km</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Duration</TableCell>
        <TableCell>{formatDuration(existing.durationMoving)}</TableCell>
        <TableCell>{formatDuration(incoming.durationMoving)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Bike</TableCell>
        <TableCell>{bikeLabel(existing.bikeId)}</TableCell>
        <TableCell>{bikeLabel(incoming.bikeId)}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
)

// --- WarningCard -------------------------------------------------------------

interface WarningCardProps {
  warning: ImportWarning
  resolution: WarningResolutionAction | undefined
  onResolve: (mtTourId: string, action: WarningResolutionAction) => void
  bikeLabel: (id?: string) => string
}

const WarningCard = ({ warning, resolution, onResolve, bikeLabel }: WarningCardProps) => {
  if (warning.type === 'AMBIGUOUS_BIKE') {
    return (
      <Alert severity="info">
        <strong>Ambiguous bike:</strong> {warning.message}
      </Alert>
    )
  }

  const actions = allowedActions(warning)
  const incoming = warning.incomingCandidate!
  const matched = warning.matchedTours![0]

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Duplicate: {incoming.title}
      </Typography>
      {(warning.matchedTours?.length ?? 0) > 1 && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {warning.matchedTours!.length} existing tours matched — Replace is not available
        </Alert>
      )}
      <TourComparisonTable existing={matched} incoming={incoming} bikeLabel={bikeLabel} />
      <RadioGroup
        row
        value={resolution ?? ''}
        onChange={(e) => onResolve(warning.mtTourId!, e.target.value as WarningResolutionAction)}
        sx={{ mt: 1 }}
      >
        {actions.includes('REPLACE') && (
          <FormControlLabel value="REPLACE" control={<Radio />} label="Replace" />
        )}
        {actions.includes('IMPORT_NEW') && (
          <FormControlLabel value="IMPORT_NEW" control={<Radio />} label="Import as new" />
        )}
        {actions.includes('SUPPRESS') && (
          <FormControlLabel value="SUPPRESS" control={<Radio />} label="Suppress" />
        )}
      </RadioGroup>
    </Paper>
  )
}

// --- MyTourbookImportReview --------------------------------------------------

export const MyTourbookImportReview = () => {
  const { data: session, isLoading } = useQuery(pendingMyTourbookSessionQuery())
  const { data: bikes } = useQuery(bikesQuery())
  const qc = useQueryClient()
  const { notify } = useNotify()

  const bikeMap = useMemo(() => new Map((bikes ?? []).map((b) => [b.id, b])), [bikes])
  const bikeLabel = (id?: string) => (id && bikeMap.get(id) ? bikeName(bikeMap.get(id)!) : '—')

  const [checkedMtTourIds, setCheckedMtTourIds] = useState<Set<string>>(new Set())
  const [resolutionsByMtTourId, setResolutionsByMtTourId] = useState<
    Record<string, WarningResolutionAction>
  >({})
  const [driftDismissed, setDriftDismissed] = useState(false)
  const [supersededNotice, setSupersededNotice] = useState(false)

  useEffect(() => {
    if (session) {
      setCheckedMtTourIds(new Set(session.candidates.map((c) => c.mtTourId)))
      setResolutionsByMtTourId({})
      setDriftDismissed(false)
    }
  }, [session?.sessionId])

  const commitMutation = useApiMutation<void, CommitImportRequest>(
    (body) => commitMyTourbookImport(session!.sessionId, body),
    {
      notifyOnError: false,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: pendingMyTourbookSessionQueryKey })
        notify('Import committed successfully', 'success')
      },
      onError: (error) => {
        if (error.status === 409) {
          setSupersededNotice(true)
          qc.invalidateQueries({ queryKey: pendingMyTourbookSessionQueryKey })
        } else {
          notify(error.message, 'error')
        }
      },
    },
  )

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No import awaiting review
        </Typography>
      </Box>
    )
  }

  if (session.candidates.length === 0 && session.warnings.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No new tours found in this upload
        </Typography>
      </Box>
    )
  }

  const unresolvedDuplicates = session.warnings.filter(
    (w) => w.type === 'LOGICAL_DUPLICATE' && !resolutionsByMtTourId[w.mtTourId!],
  )

  const handleToggleAll = () => {
    const allChecked = session.candidates.every((c) => checkedMtTourIds.has(c.mtTourId))
    setCheckedMtTourIds(
      allChecked ? new Set() : new Set(session.candidates.map((c) => c.mtTourId)),
    )
  }

  const handleToggle = (id: string) => {
    setCheckedMtTourIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = () => {
    const body = buildCommitRequest(session.candidates, checkedMtTourIds, resolutionsByMtTourId)
    commitMutation.mutate(body)
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Review Import</Typography>

      {supersededNotice && (
        <Alert severity="warning">
          This upload was replaced by a newer one. Your selections were discarded — review the
          new session.
        </Alert>
      )}

      {session.hasDrift && !driftDismissed && (
        <Alert severity="info" onClose={() => setDriftDismissed(true)}>
          Database schema version has drifted from baseline (v{session.dbVersion}).
        </Alert>
      )}

      <CandidateList
        candidates={session.candidates}
        checked={checkedMtTourIds}
        onToggle={handleToggle}
        onToggleAll={handleToggleAll}
        bikeLabel={bikeLabel}
      />

      {session.warnings.length > 0 && (
        <Stack spacing={2}>
          <Typography variant="h6">Warnings ({session.warnings.length})</Typography>
          {session.warnings.map((w, i) => (
            <WarningCard
              key={w.mtTourId ?? i}
              warning={w}
              resolution={w.mtTourId ? resolutionsByMtTourId[w.mtTourId] : undefined}
              onResolve={(id, action) =>
                setResolutionsByMtTourId((prev) => ({ ...prev, [id]: action }))
              }
              bikeLabel={bikeLabel}
            />
          ))}
        </Stack>
      )}

      {unresolvedDuplicates.length > 0 && (
        <Alert severity="info">
          {unresolvedDuplicates.length} duplicate
          {unresolvedDuplicates.length > 1 ? 's' : ''} unresolved — will reappear next upload
        </Alert>
      )}

      <Box>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={commitMutation.isPending}
        >
          {commitMutation.isPending ? 'Committing…' : 'Commit Import'}
        </Button>
      </Box>
    </Stack>
  )
}
