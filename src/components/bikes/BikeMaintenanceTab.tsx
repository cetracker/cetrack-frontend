import { useMemo, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { deleteMaintenanceTask, invalidateMaintenance, maintenanceTasksQuery } from '@/api/maintenance'
import { bikesQuery } from '@/api/bikes'
import type { MaintenanceTask } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'
import { buildMaintenanceColumns } from '@/components/maintenance/columns'
import { MaintenanceTaskForm } from '@/components/maintenance/MaintenanceTaskForm'

interface BikeMaintenanceTabProps {
  bikeId: string
}

export const BikeMaintenanceTab = ({ bikeId }: BikeMaintenanceTabProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery(maintenanceTasksQuery({ bikeId }))
  const { data: bikes } = useQuery(bikesQuery())
  const bikeById = useMemo(() => new Map((bikes ?? []).map((b) => [b.id, b])), [bikes])

  const [formOpen, setFormOpen] = useState(false)
  const [editTask, setEditTask] = useState<MaintenanceTask | null>(null)
  const [toDelete, setToDelete] = useState<MaintenanceTask | null>(null)

  const deleteMut = useApiMutation(deleteMaintenanceTask, {
    successMessage: t('maintenance.bikeTab.deletedSuccess'),
    onSuccess: async () => {
      await invalidateMaintenance(qc)
      setToDelete(null)
    },
  })

  const handleEdit = (task: MaintenanceTask) => {
    setEditTask(task)
    setFormOpen(true)
  }

  const columns = useMemo(
    () =>
      buildMaintenanceColumns({
        includeBike: false,
        bikeById,
        onEdit: handleEdit,
        onDelete: setToDelete,
      }),
    [bikeById],
  )

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditTask(null)
            setFormOpen(true)
          }}
        >
          {t('maintenance.bikeTab.addButton')}
        </Button>
      </Stack>

      <DataTable<MaintenanceTask>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        onRowClick={(t) => navigate(`/maintenance/${t.id}`)}
        enableGlobalFilter={false}
      />

      <MaintenanceTaskForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editTask}
        fixedBikeId={bikeId}
      />

      <ConfirmDialog
        open={!!toDelete}
        title={t('maintenance.bikeTab.deleteTitle')}
        message={toDelete ? t('maintenance.bikeTab.deleteMessage', { name: toDelete.name }) : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel={t('common.delete')}
        destructive
        busy={deleteMut.isPending}
      />
    </Box>
  )
}
