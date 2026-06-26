import { useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { reportQuery } from '@/api/parts'
import type { ReportItem } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { ReportItemInfoCell } from '@/components/report/ReportItemInfoCell'
import {
  formatDistanceKm,
  formatDuration,
  formatKWh,
  partIdentity,
} from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'

export const ReportList = () => {
  const { data, isLoading, error, refetch } = useQuery(reportQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'distance', desc: true },
  ])

  const columns = useMemo<ColumnDef<ReportItem>[]>(
    () => [
      {
        id: 'part',
        header: 'Part',
        accessorFn: (r) => partIdentity(r),
        cell: ({ row }) => <ReportItemInfoCell item={row.original} />,
        footer: () => `${(data ?? []).length} parts`,
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
        accessorKey: 'altUp',
        header: 'Uphill (m)',
        cell: (c) => c.getValue<number>().toLocaleString(),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'altDown',
        header: 'Downhill (m)',
        cell: (c) => c.getValue<number>().toLocaleString(),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'totalPower',
        header: 'Sum Power (kWh)',
        cell: (c) => formatKWh(c.getValue<number>()),
        meta: { align: 'right', hideOnMobile: true },
      },
    ],
    [data],
  )

  return (
    <Box>
      <Box sx={{ typography: 'h5', mb: 2 }}>Usage Report</Box>
      <DataTable<ReportItem>
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
