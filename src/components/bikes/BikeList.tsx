import { useMemo, useState } from 'react'
import { Box, Button, IconButton, Stack, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
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

const ActionsCell = ({ bike, onEdit, onDelete, onRetire }: ActionsCellProps) => (
  <RowActions
    onEdit={() => onEdit(bike)}
    onDelete={() => onDelete(bike)}
    extra={
      !bike.retiredAt && (
        <Tooltip title="Retire">
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

const buildColumns = (
  onEdit: (bike: Bike) => void,
  onDelete: (bike: Bike) => void,
  onRetire: (bike: Bike) => void,
): ColumnDef<Bike>[] => [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'manufacturer', header: 'Manufacturer' },
  { accessorKey: 'model', header: 'Model' },
  {
    accessorKey: 'purchaseDate',
    header: 'Purchase Date',
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
    successMessage: 'Bike deleted',
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
    () => buildColumns(handleEdit, setToDelete, setToRetire),
    [],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>Bikes</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditBike(null)
            setEditOpen(true)
          }}
        >
          Add bike
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
        title="Delete bike"
        message={
          toDelete
            ? `Delete "${bikeIdentity(toDelete)}"? This cannot be undone.`
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel="Delete"
        destructive
        busy={deleteMut.isPending}
      />
    </Box>
  )
}
