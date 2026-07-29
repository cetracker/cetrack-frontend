import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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

export const MaintenanceTaskDetail = () => {
  const { t } = useTranslation()
  const dueChip: Record<DueSeverity, { label: string; color: 'error' | 'success' | 'default' }> = {
    overdue: { label: t('maintenance.due.overdueChip'), color: 'error' },
    ok: { label: t('maintenance.due.okChip'), color: 'success' },
    none: { label: t('maintenance.due.noneChip'), color: 'default' },
  }
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
    successMessage: t('maintenance.bikeTab.deletedSuccess'),
    onSuccess: async () => {
      await invalidateMaintenance(qc)
      navigate('/maintenance')
    },
  })

  if (!taskId) return null

  const bike = task ? bikes?.find((b) => b.id === task.bikeId) : undefined
  const dueDisplay = task ? deriveDueDisplay(task) : null
  const chip = dueDisplay ? dueChip[dueDisplay.severity] : null

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/maintenance')}
        size="small"
        sx={{ mb: 1 }}
      >
        {t('maintenance.detail.backButton')}
      </Button>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ typography: 'h5' }}>
            {task?.name ?? (isLoading ? t('common.loading') : t('maintenance.detail.fallbackTitle'))}
          </Box>
          {bike && <Chip size="small" label={bikeIdentity(bike)} />}
          {chip && <Chip size="small" label={chip.label} color={chip.color} />}
        </Stack>
        {task && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              {t('common.edit')}
            </Button>
            <Button variant="outlined" color="error" onClick={() => setToDelete(true)}>
              {t('common.delete')}
            </Button>
            <Button variant="contained" onClick={() => setLogOpen(true)}>
              {t('maintenance.detail.logEventButton')}
            </Button>
          </Stack>
        )}
      </Stack>

      {task && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle1">{dueDisplay?.label}</Typography>
            <Typography variant="body2">
              {t('maintenance.detail.intervalLabel', { summary: formatIntervalSummary(task) })}
            </Typography>
            <Typography variant="body2">
              {t('maintenance.detail.lastPerformedLabel', {
                value: task.due?.lastPerformedAt
                  ? formatDateTime(task.due.lastPerformedAt)
                  : t('maintenance.detail.neverPerformed'),
              })}
            </Typography>
            {task.due?.distanceSinceLast != null && (
              <Typography variant="body2">
                {t('maintenance.detail.distanceSinceLabel', {
                  km: formatDistanceKm(task.due.distanceSinceLast),
                })}
              </Typography>
            )}
            {task.due?.timeSinceLast != null && (
              <Typography variant="body2">
                {t('maintenance.detail.timeSinceLabel', { value: formatDays(task.due.timeSinceLast) })}
              </Typography>
            )}
            {remainingDistanceLabel(task.due) && (
              <Typography variant="body2">
                {t('maintenance.detail.distanceRemainingLabel', {
                  value: remainingDistanceLabel(task.due),
                })}
              </Typography>
            )}
            {remainingTimeLabel(task.due) && (
              <Typography variant="body2">
                {t('maintenance.detail.timeRemainingLabel', { value: remainingTimeLabel(task.due) })}
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
            title={t('maintenance.bikeTab.deleteTitle')}
            message={t('maintenance.bikeTab.deleteMessage', { name: task.name })}
            onCancel={() => setToDelete(false)}
            onConfirm={() => deleteMut.mutate(taskId)}
            confirmLabel={t('common.delete')}
            destructive
            busy={deleteMut.isPending}
          />
          <LogEventDialog open={logOpen} onClose={() => setLogOpen(false)} taskId={taskId} />
        </>
      )}
    </Box>
  )
}
