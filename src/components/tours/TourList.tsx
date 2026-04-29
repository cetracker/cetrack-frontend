import { useMemo, useState } from 'react'
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ColumnDef,
  GroupingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { toursQuery, toursQueryKey, assignTourBike } from '@/api/tours'
import { bikesQuery } from '@/api/bikes'
import type { Bike, Tour } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import {
  bikeName,
  formatDateTime,
  formatDistanceKm,
  formatDuration,
  formatKWh,
} from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'

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
  totals: { distance: number; durationMoving: number; altUp: number; altDown: number; powerTotal: number }
  onOpenMenu: (tour: Tour, el: HTMLElement) => void
}

const buildColumns = ({ data, totals, onOpenMenu }: TourColumnExtras): ColumnDef<Tour>[] => [
  {
    accessorKey: 'title',
    header: 'Title',
    enableGrouping: false,
    footer: () => `${(data ?? []).length} tours`,
  },
  {
    accessorKey: 'startYear',
    header: 'Year',
    enableGrouping: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'startMonth',
    header: 'Month',
    enableGrouping: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'startedAt',
    header: 'Started',
    enableGrouping: false,
    cell: (c) => formatDateTime(c.getValue<string>()),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'distance',
    header: 'Distance (km)',
    enableGrouping: false,
    cell: (c) => formatDistanceKm(c.getValue<number>()),
    aggregatedCell: (c) => formatDistanceKm(c.getValue<number>()),
    footer: () => formatDistanceKm(totals.distance),
    meta: { align: 'right' },
  },
  {
    accessorKey: 'durationMoving',
    header: 'Duration Moving',
    enableGrouping: false,
    cell: (c) => formatDuration(c.getValue<number>()),
    aggregatedCell: (c) => formatDuration(c.getValue<number>()),
    footer: () => formatDuration(totals.durationMoving),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'altUp',
    header: 'Up (m)',
    enableGrouping: false,
    cell: (c) => c.getValue<number>().toLocaleString(),
    aggregatedCell: (c) => c.getValue<number>()?.toLocaleString() ?? '',
    footer: () => totals.altUp.toLocaleString(),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'altDown',
    header: 'Down (m)',
    enableGrouping: false,
    cell: (c) => c.getValue<number>().toLocaleString(),
    aggregatedCell: (c) => c.getValue<number>()?.toLocaleString() ?? '',
    footer: () => totals.altDown.toLocaleString(),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    accessorKey: 'powerTotal',
    header: 'Power (kWh)',
    enableGrouping: false,
    cell: (c) => formatKWh(c.getValue<number>()),
    aggregatedCell: (c) => formatKWh(c.getValue<number>()),
    footer: () => formatKWh(totals.powerTotal),
    meta: { align: 'right', hideOnMobile: true },
  },
  {
    id: 'bike',
    header: 'Bike',
    accessorFn: (t) => bikeName(t.bike),
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
      successMessage: 'Bike assigned',
      onSuccess: () => qc.invalidateQueries({ queryKey: toursQueryKey }),
    },
  )

  const totals = useMemo(() => {
    const rows = data ?? []
    return {
      distance: sum(rows, 'distance'),
      durationMoving: sum(rows, 'durationMoving'),
      altUp: sum(rows, 'altUp'),
      altDown: sum(rows, 'altDown'),
      powerTotal: sum(rows, 'powerTotal'),
    }
  }, [data])

  const handleOpenMenu = (tour: Tour, el: HTMLElement) => {
    setMenuTour(tour)
    setMenuEl(el)
  }

  const columns = useMemo(
    () => buildColumns({ data, totals, onOpenMenu: handleOpenMenu }),
    [data, totals],
  )

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>Tours</Box>
        <Typography variant="body2" color="text.secondary">
          Use the grouping icon in the toolbar to group by Year, Month, or Bike.
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
          <Typography variant="caption">Assign bike</Typography>
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
            <Tooltip title={bikeName(b)} placement="left">
              <Stack direction="row" spacing={1} alignItems="center">
                <DirectionsBikeIcon fontSize="small" />
                <span>{bikeName(b)}</span>
              </Stack>
            </Tooltip>
          </MenuItem>
        ))}
        {(bikes ?? []).length === 0 && (
          <MenuItem disabled>No bikes available</MenuItem>
        )}
      </Menu>
    </Box>
  )
}
