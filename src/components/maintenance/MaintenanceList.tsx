import { useMemo, useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import {
  deleteMaintenanceTask,
  invalidateMaintenance,
  maintenanceTasksQuery,
  type MaintenanceTasksFilters,
} from '@/api/maintenance'
import { bikesQuery } from '@/api/bikes'
import type { MaintenanceTask } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { BikeSelect } from '@/components/common/BikeSelect'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'
import { buildMaintenanceColumns } from './columns'
import { MaintenanceTaskForm } from './MaintenanceTaskForm'

export const MaintenanceList = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [bikeFilter, setBikeFilter] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const dueOnly = searchParams.get('due') === '1'

  const filters: MaintenanceTasksFilters = {
    ...(bikeFilter && { bikeId: bikeFilter }),
    ...(dueOnly && { due: true }),
  }
  const { data, isLoading, error, refetch } = useQuery(maintenanceTasksQuery(filters))
  const { data: bikes } = useQuery(bikesQuery())

  const bikeById = useMemo(() => new Map((bikes ?? []).map((b) => [b.id, b])), [bikes])

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])

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
        t,
        includeBike: true,
        bikeById,
        onEdit: handleEdit,
        onDelete: setToDelete,
      }),
    [t, bikeById],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>{t('maintenance.list.title')}</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditTask(null)
            setFormOpen(true)
          }}
        >
          {t('maintenance.bikeTab.addButton')}
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <BikeSelect
          value={bikeFilter}
          onChange={setBikeFilter}
          includeNone
          noneLabel={t('maintenance.list.allBikesOption')}
          sx={{ maxWidth: 260 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={dueOnly}
              onChange={(e) =>
                setSearchParams(e.target.checked ? { due: '1' } : {}, { replace: true })
              }
            />
          }
          label={t('maintenance.list.dueOnlyLabel')}
        />
      </Stack>

      <DataTable<MaintenanceTask>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={(t) => navigate(`/maintenance/${t.id}`)}
        fillHeight
      />

      <MaintenanceTaskForm open={formOpen} onClose={() => setFormOpen(false)} initial={editTask} />

      <ConfirmDialog
        open={!!toDelete}
        title={t('maintenance.bikeTab.deleteTitle')}
        message={
          toDelete ? t('maintenance.bikeTab.deleteMessage', { name: toDelete.name }) : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel={t('common.delete')}
        destructive
        busy={deleteMut.isPending}
      />
    </Box>
  )
}
