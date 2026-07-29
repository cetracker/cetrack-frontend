import { useMemo, useState } from 'react'
import { Box, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { mileageQuery } from '@/api/reports'
import type { MileageItem, MileageScope } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { ReportItemInfoCell } from '@/components/report/ReportItemInfoCell'
import { TourReport } from '@/components/report/TourReport'
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

type ReportScope = MileageScope | 'tours'

const rowIdentity = (item: MileageItem, scope: MileageScope): string =>
  scope === 'bikes' ? item.bikeName || item.bikeModel || '' : componentIdentity(item)

export const MileageReport = () => {
  const { t } = useTranslation()
  const [scope, setScope] = useState<ReportScope>('components')
  const [from, setFrom] = useState<Date | null>(null)
  const [to, setTo] = useState<Date | null>(null)
  const { data, isLoading, error, refetch } = useQuery({
    ...mileageQuery({
      scope: scope === 'tours' ? 'components' : scope,
      from: toLocalDayStartISO(from) ?? undefined,
      to: toLocalDayEndISO(to) ?? undefined,
    }),
    enabled: scope !== 'tours',
  })

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'distance', desc: true },
  ])

  const tableScope: MileageScope = scope === 'tours' ? 'components' : scope

  const columns = useMemo<ColumnDef<MileageItem>[]>(
    () => [
      {
        id: 'identity',
        header: tableScope === 'bikes' ? t('common.bike') : t('components.list.columns.component'),
        accessorFn: (r) => rowIdentity(r, tableScope),
        cell: ({ row }) =>
          tableScope === 'bikes' ? rowIdentity(row.original, tableScope) : (
            <ReportItemInfoCell item={row.original} />
          ),
        footer: () =>
          `${(data ?? []).length} ${tableScope === 'bikes' ? t('bikes.list.title') : t('components.list.title')}`,
      },
      {
        accessorKey: 'distance',
        header: t('tours.list.columns.distance'),
        cell: (c) => formatDistanceKm(c.getValue<number>()),
        meta: { align: 'right' },
      },
      {
        accessorKey: 'durationMoving',
        header: t('tours.list.columns.durationMoving'),
        cell: (c) => formatDuration(c.getValue<number>()),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'ascent',
        header: t('report.uphillHeader'),
        cell: (c) => formatNumber(c.getValue<number>()),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'descent',
        header: t('report.downhillHeader'),
        cell: (c) => formatNumber(c.getValue<number>()),
        meta: { align: 'right', hideOnMobile: true },
      },
      {
        accessorKey: 'powerTotal',
        header: t('report.sumWorkHeader'),
        cell: (c) => formatKJ(c.getValue<number | undefined>()),
        meta: { align: 'right', hideOnMobile: true },
      },
    ],
    [data, tableScope, t],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ typography: 'h5' }}>{t('report.title')}</Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {scope !== 'tours' && (
            <>
              <DatePicker
                label={t('report.fromLabel')}
                value={from}
                onChange={setFrom}
                slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
              />
              <DatePicker
                label={t('report.toLabel')}
                value={to}
                onChange={setTo}
                slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
              />
            </>
          )}
          <ToggleButtonGroup
            value={scope}
            exclusive
            size="small"
            onChange={(_, v: ReportScope | null) => v && setScope(v)}
          >
            <ToggleButton value="components">{t('components.list.title')}</ToggleButton>
            <ToggleButton value="bikes">{t('bikes.list.title')}</ToggleButton>
            <ToggleButton value="tours">{t('report.tours.scopeLabel')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>
      {scope === 'tours' ? (
        <TourReport />
      ) : (
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
      )}
    </Box>
  )
}
