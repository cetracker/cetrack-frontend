import { bikesQuery } from '@/api/bikes'
import { assignTourBike, toursQuery, toursQueryKey } from '@/api/tours'
import { DataTable } from '@/components/common/DataTable'
import { useApiMutation } from '@/hooks/useApiMutation'
import type { Bike, Tour } from '@/types/api'
import { createErrorDisplay } from '@/utils/errors'
import { bikeIdentity } from '@/utils/formatters'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import {
  Box,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  GroupingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { buildColumns } from './tourColumns'
import { useTranslation } from 'react-i18next'

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

  const handleOpenMenu = useCallback((tour: Tour, el: HTMLElement) => {
    setMenuTour(tour)
    setMenuEl(el)
  }, [])

  const columns = useMemo(
    () => buildColumns(t, { onOpenMenu: handleOpenMenu }),
    [t, handleOpenMenu],
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
        virtualized
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
