import { useMemo, useState } from 'react'
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { mileageQuery } from '@/api/reports'
import type { MileageItem, MileageScope } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { ReportItemInfoCell } from '@/components/report/ReportItemInfoCell'
import {
  componentIdentity,
  formatDistanceKm,
  formatDuration,
  formatKJ,
} from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'

const rowIdentity = (item: MileageItem, scope: MileageScope): string =>
  scope === 'bikes' ? item.bikeName || item.bikeModel || '' : componentIdentity(item)

export const MileageReport = () => {
  const [scope, setScope] = useState<MileageScope>('components')
  const { data, isLoading, error, refetch } = useQuery(mileageQuery({ scope }))

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'distance', desc: true },
  ])

  const columns = useMemo<ColumnDef<MileageItem>[]>(
    () => [
      {
        id: 'identity',
        header: scope === 'bikes' ? 'Bike' : 'Component',
        accessorFn: (r) => rowIdentity(r, scope),
        cell: ({ row }) =>
          scope === 'bikes' ? rowIdentity(row.original, scope) : (
            <ReportItemInfoCell item={row.original} />
          ),
        footer: () => `${(data ?? []).length} ${scope}`,
      },
      {
        accessorKey: 'distance',
        header: 'Distance (km)',
        cell: (c) => formatDistanceKm(c.getValue<number>()),
        meta: { align: 'right' },
      },
      {
        accessorKey: 'durationMoving',
        header: 'Duration Moving',
        cell: (c) => formatDuration(c.getValue<number>()),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'ascent',
        header: 'Uphill (m)',
        cell: (c) => c.getValue<number>().toLocaleString(),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'descent',
        header: 'Downhill (m)',
        cell: (c) => c.getValue<number>().toLocaleString(),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'powerTotal',
        header: 'Sum Work (kJ)',
        cell: (c) => formatKJ(c.getValue<number | undefined>()),
        meta: { align: 'right', hideOnMobile: true },
      },
    ],
    [data, scope],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>Usage Report</Box>
        <ToggleButtonGroup
          value={scope}
          exclusive
          size="small"
          onChange={(_, v: MileageScope | null) => v && setScope(v)}
        >
          <ToggleButton value="components">Components</ToggleButton>
          <ToggleButton value="bikes">Bikes</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <DataTable<MileageItem>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        showFooter
      />
    </Box>
  )
}
