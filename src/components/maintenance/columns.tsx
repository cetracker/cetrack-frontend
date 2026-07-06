import { Chip, Stack, Typography } from '@mui/material'
import type { ColumnDef } from '@tanstack/react-table'
import type { Bike, MaintenanceTask } from '@/types/api'
import { RowActions } from '@/components/common/RowActions'
import { bikeIdentity, formatDate } from '@/utils/formatters'
import { deriveDueDisplay, formatIntervalSummary, type DueSeverity } from '@/utils/maintenanceDue'

const DUE_CHIP: Record<DueSeverity, { label: string; color: 'error' | 'success' | 'default' }> = {
  overdue: { label: 'Due', color: 'error' },
  ok: { label: 'OK', color: 'success' },
  none: { label: '—', color: 'default' },
}

interface BuildMaintenanceColumnsOptions {
  includeBike: boolean
  bikeById: Map<string, Bike>
  onEdit: (task: MaintenanceTask) => void
  onDelete: (task: MaintenanceTask) => void
}

export const buildMaintenanceColumns = ({
  includeBike,
  bikeById,
  onEdit,
  onDelete,
}: BuildMaintenanceColumnsOptions): ColumnDef<MaintenanceTask>[] => [
  { accessorKey: 'name', header: 'Name' },
  ...(includeBike
    ? ([
        {
          id: 'bike',
          header: 'Bike',
          accessorFn: (t: MaintenanceTask) => bikeIdentity(bikeById.get(t.bikeId)),
        },
      ] as ColumnDef<MaintenanceTask>[])
    : []),
  {
    id: 'interval',
    header: 'Interval',
    enableSorting: false,
    accessorFn: (t) => formatIntervalSummary(t),
  },
  {
    id: 'due',
    header: 'Due',
    accessorFn: (t) => deriveDueDisplay(t).severity,
    cell: ({ row }) => {
      const display = deriveDueDisplay(row.original)
      const chip = DUE_CHIP[display.severity]
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
    header: 'Created',
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
