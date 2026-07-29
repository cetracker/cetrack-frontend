import type { Tour } from '@/types/api'
import {
  bikeIdentity,
  formatDateTime,
  formatDistanceKm,
  formatDuration,
  formatKJ,
  formatMonthShort,
  formatNumber,
} from '@/utils/formatters'
import { Box } from '@mui/material'
import type { ColumnDef, HeaderContext } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { TourActionsCell } from './TourActionsCell'

/**
 * Totals follow the filtered row model, so they describe what the search box is
 * showing rather than the raw fetch. Pre-grouping leaf rows, so grouping cannot
 * double-count.
 */
const totalOf = (ctx: HeaderContext<Tour, unknown>, key: keyof Tour): number =>
  ctx.table
    .getFilteredRowModel()
    .rows.reduce((acc, r) => acc + ((r.original[key] as number | undefined) ?? 0), 0)

interface TourColumnExtras {
  onOpenMenu: (tour: Tour, el: HTMLElement) => void
}

// Explicit sizes: the virtualized table uses `table-layout: fixed`, so widths
// can no longer be derived from whichever rows happen to be in the DOM. Sized
// from the longer locale (German) plus cell padding and the sort arrow.
export const buildColumns = (
  t: TFunction,
  { onOpenMenu }: TourColumnExtras,
): ColumnDef<Tour>[] => [
  {
    accessorKey: 'title',
    header: t('tours.list.columns.title'),
    enableGrouping: false,
    size: 240,
    cell: (c) => (
      <Box
        title={c.getValue<string>()}
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {c.getValue<string>()}
      </Box>
    ),
    footer: (ctx) =>
      t('tours.list.columns.titleFooter', {
        count: ctx.table.getFilteredRowModel().rows.length,
      }),
  },
  {
    accessorKey: 'startYear',
    header: t('tours.list.columns.year'),
    enableGrouping: true,
    size: 80,
    meta: { align: 'left' },
  },
  {
    accessorKey: 'startMonth',
    header: t('tours.list.columns.month'),
    enableGrouping: true,
    size: 90,
    cell: (c) => formatMonthShort(c.getValue<number>()),
    meta: { align: 'left' },
  },
  {
    accessorKey: 'startedAt',
    header: t('tours.list.columns.started'),
    enableGrouping: false,
    size: 150,
    cell: (c) => formatDateTime(c.getValue<string>()),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'distance',
    header: t('tours.list.columns.distance'),
    enableGrouping: false,
    size: 120,
    cell: (c) => formatDistanceKm(c.getValue<number>()),
    aggregatedCell: (c) => formatDistanceKm(c.getValue<number>()),
    footer: (ctx) => formatDistanceKm(totalOf(ctx, 'distance')),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'durationMoving',
    header: t('tours.list.columns.durationMoving'),
    enableGrouping: false,
    size: 120,
    cell: (c) => formatDuration(c.getValue<number>()),
    aggregatedCell: (c) => formatDuration(c.getValue<number>()),
    footer: (ctx) => formatDuration(totalOf(ctx, 'durationMoving')),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'ascent',
    header: t('tours.list.columns.up'),
    enableGrouping: false,
    size: 95,
    cell: (c) => formatNumber(c.getValue<number>()),
    aggregatedCell: (c) => {
      const v = c.getValue<number>()
      return v != null ? formatNumber(v) : ''
    },
    footer: (ctx) => formatNumber(totalOf(ctx, 'ascent')),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'descent',
    header: t('tours.list.columns.down'),
    enableGrouping: false,
    size: 95,
    cell: (c) => formatNumber(c.getValue<number>()),
    aggregatedCell: (c) => {
      const v = c.getValue<number>()
      return v != null ? formatNumber(v) : ''
    },
    footer: (ctx) => formatNumber(totalOf(ctx, 'descent')),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'powerTotal',
    header: t('tours.list.columns.work'),
    enableGrouping: false,
    size: 105,
    cell: (c) => formatKJ(c.getValue<number>()),
    aggregatedCell: (c) => formatKJ(c.getValue<number>()),
    footer: (ctx) => formatKJ(totalOf(ctx, 'powerTotal')),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    id: 'bike',
    header: t('common.bike'),
    accessorFn: (tour) => bikeIdentity(tour.bike),
    enableGrouping: true,
    size: 150,
    filterFn: 'equalsString',
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    size: 56,
    cell: ({ row }) => (
      <TourActionsCell tour={row.original} onOpenMenu={onOpenMenu} />
    ),
  },
]
