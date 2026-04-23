import { useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { reportQuery } from '@/api/parts'
import type { ReportItem } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import {
  formatDistanceKm,
  formatDuration,
  formatKWh,
} from '@/utils/formatters'

const sum = (rows: ReportItem[], key: keyof ReportItem): number =>
  rows.reduce((acc, r) => acc + ((r[key] as number | undefined) ?? 0), 0)

export const ReportList = () => {
  const { data, isLoading, error, refetch } = useQuery(reportQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'distance', desc: true },
  ])

  const totals = useMemo(() => {
    const rows = data ?? []
    return {
      distance: sum(rows, 'distance'),
      durationMoving: sum(rows, 'durationMoving'),
      altUp: sum(rows, 'altUp'),
      altDown: sum(rows, 'altDown'),
      totalPower: sum(rows, 'totalPower'),
    }
  }, [data])

  const columns = useMemo<ColumnDef<ReportItem>[]>(
    () => [
      {
        accessorKey: 'part',
        header: 'Part',
        footer: () => `${(data ?? []).length} parts`,
      },
      {
        accessorKey: 'distance',
        header: 'Distance (km)',
        cell: (c) => formatDistanceKm(c.getValue<number>()),
        footer: () => formatDistanceKm(totals.distance),
        meta: { align: 'right' },
      },
      {
        accessorKey: 'durationMoving',
        header: 'Duration Moving',
        cell: (c) => formatDuration(c.getValue<number>()),
        footer: () => formatDuration(totals.durationMoving),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'altUp',
        header: 'Uphill (m)',
        cell: (c) => c.getValue<number>().toLocaleString(),
        footer: () => totals.altUp.toLocaleString(),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'altDown',
        header: 'Downhill (m)',
        cell: (c) => c.getValue<number>().toLocaleString(),
        footer: () => totals.altDown.toLocaleString(),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'totalPower',
        header: 'Sum Power (kWh)',
        cell: (c) => formatKWh(c.getValue<number>()),
        footer: () => formatKWh(totals.totalPower),
        meta: { align: 'right', hideOnMobile: true },
      },
    ],
    [data, totals],
  )

  return (
    <Box>
      <Box sx={{ typography: 'h5', mb: 2 }}>Usage Report</Box>
      <DataTable<ReportItem>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error ? { message: (error as { message?: string }).message ?? 'Failed to load' } : null}
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
