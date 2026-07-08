import { useState } from 'react'
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { deleteMaintenanceEvent, invalidateMaintenance, maintenanceEventsQuery } from '@/api/maintenance'
import { formatDateTime, formatDistanceKm } from '@/utils/formatters'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import type { MaintenanceEvent } from '@/types/api'

interface MaintenanceEventsTableProps {
  taskId: string
}

export const MaintenanceEventsTable = ({ taskId }: MaintenanceEventsTableProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: events } = useQuery(maintenanceEventsQuery(taskId))
  const [toDelete, setToDelete] = useState<MaintenanceEvent | null>(null)

  const deleteMut = useApiMutation((eventId: string) => deleteMaintenanceEvent(taskId, eventId), {
    successMessage: t('maintenance.events.deletedSuccess'),
    onSuccess: async () => {
      await invalidateMaintenance(qc)
      setToDelete(null)
    },
  })

  const sorted = (events ?? []).slice().sort((a, b) => b.performedAt.localeCompare(a.performedAt))

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        {t('maintenance.events.empty')}
      </Typography>
    )
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('maintenance.events.performedAtHeader')}</TableCell>
            <TableCell>{t('maintenance.events.loggedHeader')}</TableCell>
            <TableCell>{t('maintenance.events.riddenSinceHeader')}</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{formatDateTime(e.performedAt)}</TableCell>
              <TableCell>{formatDateTime(e.createdAt)}</TableCell>
              <TableCell>{e.distanceSincePrevious != null ? `${formatDistanceKm(e.distanceSincePrevious)} km` : ''}</TableCell>
              <TableCell align="right">
                <Tooltip title={t('common.delete')}>
                  <IconButton size="small" color="error" onClick={() => setToDelete(e)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!toDelete}
        title={t('maintenance.events.removeTitle')}
        message={t('maintenance.events.removeMessage')}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel={t('maintenance.events.removeButton')}
        destructive
        busy={deleteMut.isPending}
      />
    </>
  )
}
