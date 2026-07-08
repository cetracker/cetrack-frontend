import { Chip, Stack, Typography } from '@mui/material'
import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import type { Bike, MaintenanceTask } from '@/types/api'
import { RowActions } from '@/components/common/RowActions'
import { bikeIdentity, formatDate } from '@/utils/formatters'
import { deriveDueDisplay, formatIntervalSummary, type DueSeverity } from '@/utils/maintenanceDue'

const dueChip = (
  t: TFunction,
): Record<DueSeverity, { label: string; color: 'error' | 'success' | 'default' }> => ({
  overdue: { label: t('maintenance.due.overdueChip'), color: 'error' },
  ok: { label: t('maintenance.due.okChip'), color: 'success' },
  none: { label: t('maintenance.due.noneChip'), color: 'default' },
})

interface BuildMaintenanceColumnsOptions {
  t: TFunction
  includeBike: boolean
  bikeById: Map<string, Bike>
  onEdit: (task: MaintenanceTask) => void
  onDelete: (task: MaintenanceTask) => void
}

export const buildMaintenanceColumns = ({
  t,
  includeBike,
  bikeById,
  onEdit,
  onDelete,
}: BuildMaintenanceColumnsOptions): ColumnDef<MaintenanceTask>[] => [
  { accessorKey: 'name', header: t('common.name') },
  ...(includeBike
    ? ([
        {
          id: 'bike',
          header: t('common.bike'),
          accessorFn: (task: MaintenanceTask) => bikeIdentity(bikeById.get(task.bikeId)),
        },
      ] as ColumnDef<MaintenanceTask>[])
    : []),
  {
    id: 'interval',
    header: t('maintenance.columns.interval'),
    enableSorting: false,
    accessorFn: (task) => formatIntervalSummary(task),
  },
  {
    id: 'due',
    header: t('maintenance.columns.due'),
    accessorFn: (task) => deriveDueDisplay(task).severity,
    cell: ({ row }) => {
      const display = deriveDueDisplay(row.original)
      const chip = dueChip(t)[display.severity]
      return (
        <Stack spacing={0}>
          <Chip size="small" label={chip.label} color={chip.color} />
          <Typography variant="caption" color="text.secondary">
            {display.label}
          </Typography>
        </Stack>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: t('common.created'),
    cell: (c) => formatDate(c.getValue<string | null>()),
    meta: { hideOnMobile: true },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <RowActions onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original)} />
    ),
  },
]
