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
import { deleteMaintenanceEvent, invalidateMaintenance, maintenanceEventsQuery } from '@/api/maintenance'
import { formatDateTime } from '@/utils/formatters'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import type { MaintenanceEvent } from '@/types/api'

interface MaintenanceEventsTableProps {
  taskId: string
}

export const MaintenanceEventsTable = ({ taskId }: MaintenanceEventsTableProps) => {
  const qc = useQueryClient()
  const { data: events } = useQuery(maintenanceEventsQuery(taskId))
  const [toDelete, setToDelete] = useState<MaintenanceEvent | null>(null)

  const deleteMut = useApiMutation((eventId: string) => deleteMaintenanceEvent(taskId, eventId), {
    successMessage: 'Event deleted',
    onSuccess: async () => {
      await invalidateMaintenance(qc)
      setToDelete(null)
    },
  })

  const sorted = (events ?? []).slice().sort((a, b) => b.performedAt.localeCompare(a.performedAt))

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No events logged yet.
      </Typography>
    )
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Performed at</TableCell>
            <TableCell>Logged</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{formatDateTime(e.performedAt)}</TableCell>
              <TableCell>{formatDateTime(e.createdAt)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Delete">
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
        title="Remove event"
        message="Remove this event? The task's due state will be recalculated."
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel="Remove"
        destructive
        busy={deleteMut.isPending}
      />
    </>
  )
}
