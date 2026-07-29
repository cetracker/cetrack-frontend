import { useMemo, useState } from 'react'
import { Box, Button, IconButton, Stack, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { bikesQuery, bikesQueryKey, deleteBike } from '@/api/bikes'
import type { Bike } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { BikeForm } from './BikeForm'
import { RetireBikeDialog } from './RetireBikeDialog'
import { bikeIdentity, formatDate } from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'

interface ActionsCellProps {
  bike: Bike
  onEdit: (bike: Bike) => void
  onDelete: (bike: Bike) => void
  onRetire: (bike: Bike) => void
}

const ActionsCell = ({ bike, onEdit, onDelete, onRetire }: ActionsCellProps) => {
  const { t } = useTranslation()
  return (
    <RowActions
      onEdit={() => onEdit(bike)}
      onDelete={() => onDelete(bike)}
      extra={
        !bike.retiredAt && (
          <Tooltip title={t('bikes.list.retireTooltip')}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onRetire(bike)
              }}
            >
              <EventBusyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      }
    />
  )
}

const buildColumns = (
  t: TFunction,
  onEdit: (bike: Bike) => void,
  onDelete: (bike: Bike) => void,
  onRetire: (bike: Bike) => void,
): ColumnDef<Bike>[] => [
  { accessorKey: 'name', header: t('common.name') },
  { accessorKey: 'manufacturer', header: t('common.manufacturer') },
  { accessorKey: 'model', header: t('common.model') },
  {
    accessorKey: 'purchaseDate',
    header: t('common.purchaseDate'),
    cell: (c) => formatDate(c.getValue<string | null>()),
    meta: { hideOnMobile: true },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <ActionsCell
        bike={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
        onRetire={onRetire}
      />
    ),
  },
]

export const BikeList = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery(bikesQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'manufacturer', desc: false },
    { id: 'model', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editBike, setEditBike] = useState<Bike | null>(null)
  const [toDelete, setToDelete] = useState<Bike | null>(null)
  const [toRetire, setToRetire] = useState<Bike | null>(null)

  const deleteMut = useApiMutation(deleteBike, {
    successMessage: t('bikes.list.deletedSuccess'),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: bikesQueryKey })
      setToDelete(null)
    },
  })

  const handleEdit = (bike: Bike) => {
    setEditBike(bike)
    setEditOpen(true)
  }

  const columns = useMemo(
    () => buildColumns(t, handleEdit, setToDelete, setToRetire),
    [t],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>{t('bikes.list.title')}</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditBike(null)
            setEditOpen(true)
          }}
        >
          {t('bikes.list.addButton')}
        </Button>
      </Stack>

      <DataTable<Bike>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={(b) => navigate(`/bikes/${b.id}`)}
        fillHeight
      />

      <BikeForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editBike}
      />

      {toRetire && (
        <RetireBikeDialog
          open={!!toRetire}
          onClose={() => setToRetire(null)}
          bikeId={toRetire.id}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={t('bikes.list.deleteTitle')}
        message={
          toDelete
            ? t('common.deleteConfirmMessage', { name: bikeIdentity(toDelete) })
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel={t('common.delete')}
        destructive
        busy={deleteMut.isPending}
      />
    </Box>
  )
}
