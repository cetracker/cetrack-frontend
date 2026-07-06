import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteMaintenanceTask, invalidateMaintenance, maintenanceTaskQuery } from '@/api/maintenance'
import { bikesQuery } from '@/api/bikes'
import { MaintenanceTaskForm } from './MaintenanceTaskForm'
import { MaintenanceEventsTable } from './MaintenanceEventsTable'
import { LogEventDialog } from './LogEventDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { bikeIdentity, formatDateTime, formatDistanceKm } from '@/utils/formatters'
import {
  deriveDueDisplay,
  formatDays,
  formatIntervalSummary,
  remainingDistanceLabel,
  remainingTimeLabel,
  type DueSeverity,
} from '@/utils/maintenanceDue'

const DUE_CHIP: Record<DueSeverity, { label: string; color: 'error' | 'success' | 'default' }> = {
  overdue: { label: 'Due', color: 'error' },
  ok: { label: 'OK', color: 'success' },
  none: { label: '—', color: 'default' },
}

export const MaintenanceTaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: task, isLoading } = useQuery({
    ...maintenanceTaskQuery(taskId ?? ''),
    enabled: !!taskId,
  })
  const { data: bikes } = useQuery(bikesQuery())

  const [editOpen, setEditOpen] = useState(false)
  const [toDelete, setToDelete] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const deleteMut = useApiMutation(deleteMaintenanceTask, {
    successMessage: 'Maintenance task deleted',
    onSuccess: async () => {
      await invalidateMaintenance(qc)
      navigate('/maintenance')
    },
  })

  if (!taskId) return null

  const bike = task ? bikes?.find((b) => b.id === task.bikeId) : undefined
  const dueDisplay = task ? deriveDueDisplay(task) : null
  const chip = dueDisplay ? DUE_CHIP[dueDisplay.severity] : null

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/maintenance')}
        size="small"
        sx={{ mb: 1 }}
      >
        Back to maintenance
      </Button>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ typography: 'h5' }}>
            {task?.name ?? (isLoading ? 'Loading…' : 'Maintenance task')}
          </Box>
          {bike && <Chip size="small" label={bikeIdentity(bike)} />}
          {chip && <Chip size="small" label={chip.label} color={chip.color} />}
        </Stack>
        {task && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="outlined" color="error" onClick={() => setToDelete(true)}>
              Delete
            </Button>
            <Button variant="contained" onClick={() => setLogOpen(true)}>
              Log event
            </Button>
          </Stack>
        )}
      </Stack>

      {task && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1">{dueDisplay?.label}</Typography>
            <Typography variant="body2">Interval: {formatIntervalSummary(task)}</Typography>
            <Typography variant="body2">
              Last performed:{' '}
              {task.due?.lastPerformedAt
                ? formatDateTime(task.due.lastPerformedAt)
                : "Never — counting since the bike's first tour"}
            </Typography>
            {task.due?.distanceSinceLast != null && (
              <Typography variant="body2">
                Distance since last: {formatDistanceKm(task.due.distanceSinceLast)} km
              </Typography>
            )}
            {task.due?.timeSinceLast != null && (
              <Typography variant="body2">
                Time since last: {formatDays(task.due.timeSinceLast)}
              </Typography>
            )}
            {remainingDistanceLabel(task.due) && (
              <Typography variant="body2">
                Distance remaining: {remainingDistanceLabel(task.due)}
              </Typography>
            )}
            {remainingTimeLabel(task.due) && (
              <Typography variant="body2">
                Time remaining: {remainingTimeLabel(task.due)}
              </Typography>
            )}
          </Stack>
        </Paper>
      )}

      {task && <MaintenanceEventsTable taskId={taskId} />}

      {task && (
        <>
          <MaintenanceTaskForm open={editOpen} onClose={() => setEditOpen(false)} initial={task} />
          <ConfirmDialog
            open={toDelete}
            title="Delete maintenance task"
            message={`Delete "${task.name}"? This also deletes its event history.`}
            onCancel={() => setToDelete(false)}
            onConfirm={() => deleteMut.mutate(taskId)}
            confirmLabel="Delete"
            destructive
            busy={deleteMut.isPending}
          />
          <LogEventDialog open={logOpen} onClose={() => setLogOpen(false)} taskId={taskId} />
        </>
      )}
    </Box>
  )
}
