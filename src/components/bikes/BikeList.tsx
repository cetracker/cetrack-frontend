import { useMemo, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { bikesQuery, bikesQueryKey, deleteBike } from '@/api/bikes'
import type { Bike } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { BikeForm } from './BikeForm'
import { formatDate } from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'

export const BikeList = () => {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery(bikesQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'manufacturer', desc: false },
    { id: 'model', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editBike, setEditBike] = useState<Bike | null>(null)
  const [toDelete, setToDelete] = useState<Bike | null>(null)

  const deleteMut = useApiMutation(deleteBike, {
    successMessage: 'Bike deleted',
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bikesQueryKey })
      setToDelete(null)
    },
  })

  const columns = useMemo<ColumnDef<Bike>[]>(
    () => [
      { accessorKey: 'manufacturer', header: 'Manufacturer' },
      { accessorKey: 'model', header: 'Model' },
      {
        accessorKey: 'boughtAt',
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
          <RowActions
            onEdit={() => {
              setEditBike(row.original)
              setEditOpen(true)
            }}
            onDelete={() => setToDelete(row.original)}
          />
        ),
      },
    ],
    [],
  )

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
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
        onRowClick={(b) => {
          setEditBike(b)
          setEditOpen(true)
        }}
      />

      <BikeForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editBike}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete bike"
        message={
          toDelete
            ? `Delete "${toDelete.manufacturer} ${toDelete.model}"? This cannot be undone.`
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
