import { bikesQuery } from '@/api/bikes'
import { assignTourBike, toursQuery, toursQueryKey } from '@/api/tours'
import { DataTable } from '@/components/common/DataTable'
import { useApiMutation } from '@/hooks/useApiMutation'
import type { Bike, Tour } from '@/types/api'
import { createErrorDisplay } from '@/utils/errors'
import {
  bikeIdentity,
  formatDateTime,
  formatDistanceKm,
  formatDuration,
  formatKJ,
  formatNumber,
} from '@/utils/formatters'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ColumnDef,
  GroupingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const sum = (rows: Tour[], key: keyof Tour): number =>
  rows.reduce((acc, r) => acc + ((r[key] as number | undefined) ?? 0), 0)

interface TourActionsCellProps {
  tour: Tour
  onOpenMenu: (tour: Tour, el: HTMLElement) => void
}

const TourActionsCell = ({ tour, onOpenMenu }: TourActionsCellProps) => (
  <IconButton
    size="small"
    onClick={(e) => {
      e.stopPropagation()
      onOpenMenu(tour, e.currentTarget)
    }}
  >
    <MoreVertIcon fontSize="small" />
  </IconButton>
)

interface TourColumnExtras {
  data: Tour[] | undefined
  totals: { distance: number; durationMoving: number; ascent: number; descent: number; powerTotal: number }
  onOpenMenu: (tour: Tour, el: HTMLElement) => void
}

const buildColumns = (
  t: TFunction,
  { data, totals, onOpenMenu }: TourColumnExtras,
): ColumnDef<Tour>[] => [
  {
    accessorKey: 'title',
    header: t('tours.list.columns.title'),
    enableGrouping: false,
    footer: () => t('tours.list.columns.titleFooter', { count: (data ?? []).length }),
  },
  {
    accessorKey: 'startYear',
    header: t('tours.list.columns.year'),
    enableGrouping: true,
    meta: { align: 'left' },
  },
  {
    accessorKey: 'startMonth',
    header: t('tours.list.columns.month'),
    enableGrouping: true,
    meta: { align: 'left' },
  },
  {
    accessorKey: 'startedAt',
    header: t('tours.list.columns.started'),
    enableGrouping: false,
    cell: (c) => formatDateTime(c.getValue<string>()),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'distance',
    header: t('tours.list.columns.distance'),
    enableGrouping: false,
    cell: (c) => formatDistanceKm(c.getValue<number>()),
    aggregatedCell: (c) => formatDistanceKm(c.getValue<number>()),
    footer: () => formatDistanceKm(totals.distance),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'durationMoving',
    header: t('tours.list.columns.durationMoving'),
    enableGrouping: false,
    cell: (c) => formatDuration(c.getValue<number>()),
    aggregatedCell: (c) => formatDuration(c.getValue<number>()),
    footer: () => formatDuration(totals.durationMoving),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'ascent',
    header: t('tours.list.columns.up'),
    enableGrouping: false,
    cell: (c) => formatNumber(c.getValue<number>()),
    aggregatedCell: (c) => {
      const v = c.getValue<number>()
      return v != null ? formatNumber(v) : ''
    },
    footer: () => formatNumber(totals.ascent),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'descent',
    header: t('tours.list.columns.down'),
    enableGrouping: false,
    cell: (c) => formatNumber(c.getValue<number>()),
    aggregatedCell: (c) => {
      const v = c.getValue<number>()
      return v != null ? formatNumber(v) : ''
    },
    footer: () => formatNumber(totals.descent),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'powerTotal',
    header: t('tours.list.columns.work'),
    enableGrouping: false,
    cell: (c) => formatKJ(c.getValue<number>()),
    aggregatedCell: (c) => formatKJ(c.getValue<number>()),
    footer: () => formatKJ(totals.powerTotal),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    id: 'bike',
    header: t('common.bike'),
    accessorFn: (tour) => bikeIdentity(tour.bike),
    enableGrouping: true,
    filterFn: 'equalsString',
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <TourActionsCell tour={row.original} onOpenMenu={onOpenMenu} />
    ),
  },
]

export const TourList = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery(toursQuery())
  const { data: bikes } = useQuery(bikesQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'startedAt', desc: true },
  ])
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    startYear: false,
    startMonth: false,
  })

  // Hidden assign-bike action menu
  const [menuEl, setMenuEl] = useState<HTMLElement | null>(null)
  const [menuTour, setMenuTour] = useState<Tour | null>(null)

  const assignMut = useApiMutation(
    (v: { tourId: string; bikeId: string }) =>
      assignTourBike(v.tourId, v.bikeId),
    {
      successMessage: t('tours.list.assignedSuccess'),
      onSuccess: () => qc.invalidateQueries({ queryKey: toursQueryKey }),
    },
  )

  const totals = useMemo(() => {
    const rows = data ?? []
    return {
      distance: sum(rows, 'distance'),
      durationMoving: sum(rows, 'durationMoving'),
      ascent: sum(rows, 'ascent'),
      descent: sum(rows, 'descent'),
      powerTotal: sum(rows, 'powerTotal'),
    }
  }, [data])

  const handleOpenMenu = (tour: Tour, el: HTMLElement) => {
    setMenuTour(tour)
    setMenuEl(el)
  }

  const columns = useMemo(
    () => buildColumns(t, { data, totals, onOpenMenu: handleOpenMenu }),
    [t, data, totals],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>{t('tours.list.title')}</Box>
        <Typography variant="body2" color="text.secondary">
          {t('tours.list.groupingHint')}
        </Typography>
      </Stack>

      <DataTable<Tour>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        grouping={grouping}
        onGroupingChange={setGrouping}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        enableGrouping
        showFooter
        fillHeight
      />

      <Menu
        anchorEl={menuEl}
        open={!!menuEl}
        onClose={() => {
          setMenuEl(null)
          setMenuTour(null)
        }}
      >
        <MenuItem disabled>
          <Typography variant="caption">{t('tours.list.assignBikeLabel')}</Typography>
        </MenuItem>
        {(bikes ?? []).map((b: Bike) => (
          <MenuItem
            key={b.id}
            onClick={() => {
              if (menuTour) assignMut.mutate({ tourId: menuTour.id, bikeId: b.id })
              setMenuEl(null)
              setMenuTour(null)
            }}
          >
            <Tooltip title={bikeIdentity(b)} placement="left">
              <Stack sx={{ flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                <DirectionsBikeIcon fontSize="small" />
                <span>{bikeIdentity(b)}</span>
              </Stack>
            </Tooltip>
          </MenuItem>
        ))}
        {(bikes ?? []).length === 0 && (
          <MenuItem disabled>{t('tours.list.noBikesAvailable')}</MenuItem>
        )}
      </Menu>
    </Box>
  )
}
