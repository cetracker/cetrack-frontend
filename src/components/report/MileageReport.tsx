import { useMemo, useState } from 'react'
import { Box, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
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
  formatNumber,
  toLocalDayEndISO,
  toLocalDayStartISO,
} from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'

const rowIdentity = (item: MileageItem, scope: MileageScope): string =>
  scope === 'bikes' ? item.bikeName || item.bikeModel || '' : componentIdentity(item)

export const MileageReport = () => {
  const [scope, setScope] = useState<MileageScope>('components')
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const { data, isLoading, error, refetch } = useQuery(
    mileageQuery({
      scope,
      from: toLocalDayStartISO(from) ?? undefined,
      to: toLocalDayEndISO(to) ?? undefined,
    }),
  )

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
        cell: (c) => formatNumber(c.getValue<number>()),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'descent',
        header: 'Downhill (m)',
        cell: (c) => formatNumber(c.getValue<number>()),
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ typography: 'h5' }}>Usage Report</Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <DatePicker
            label="From"
            value={from}
            onChange={setFrom}
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          <DatePicker
            label="To"
            value={to}
            onChange={setTo}
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          <ToggleButtonGroup
            value={scope}
            exclusive
            size="small"
            onChange={(_, v: MileageScope | null) => v && setScope(v)}
          >
            <ToggleButton value="components">Components</ToggleButton>
            <ToggleButton value="bikes">Bikes</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
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
