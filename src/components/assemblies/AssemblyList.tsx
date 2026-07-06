import { useMemo, useState } from 'react'
import { Box, Button, Chip, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { assembliesQuery, assembliesQueryKey, deleteAssembly } from '@/api/assemblies'
import { positionsQuery } from '@/api/catalog'
import type { Assembly } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AssemblyForm } from './AssemblyForm'
import { formatDate } from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'

interface ActionsCellProps {
  assembly: Assembly
  onEdit: (assembly: Assembly) => void
  onDelete: (assembly: Assembly) => void
}

const ActionsCell = ({ assembly, onEdit, onDelete }: ActionsCellProps) => (
  <RowActions onEdit={() => onEdit(assembly)} onDelete={() => onDelete(assembly)} />
)

const buildColumns = (
  positionNameById: Map<string, string>,
  onEdit: (assembly: Assembly) => void,
  onDelete: (assembly: Assembly) => void,
): ColumnDef<Assembly>[] => [
  { accessorKey: 'name', header: 'Name' },
  {
    id: 'position',
    header: 'Position',
    accessorFn: (a) => (a.positionId ? positionNameById.get(a.positionId) ?? '' : ''),
  },
  {
    id: 'complete',
    header: 'Complete',
    accessorFn: (a) => a.complete,
    cell: (c) => (
      <Chip
        size="small"
        label={c.getValue<boolean>() ? 'Complete' : 'Incomplete'}
        color={c.getValue<boolean>() ? 'success' : 'default'}
      />
    ),
  },
  {
    id: 'mounted',
    header: 'Mounted',
    accessorFn: (a) => a.mounted,
    cell: (c) => (
      <Chip
        size="small"
        label={c.getValue<boolean>() ? 'Mounted' : 'Unmounted'}
        color={c.getValue<boolean>() ? 'primary' : 'default'}
      />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: (c) => formatDate(c.getValue<string | null>()),
    meta: { hideOnMobile: true },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <ActionsCell assembly={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
  },
]

export const AssemblyList = () => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery(assembliesQuery())
  const { data: positions } = useQuery(positionsQuery())

  const positionNameById = useMemo(
    () => new Map((positions ?? []).map((p) => [p.id, p.name])),
    [positions],
  )

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])

  const [editOpen, setEditOpen] = useState(false)
  const [editAssembly, setEditAssembly] = useState<Assembly | null>(null)
  const [toDelete, setToDelete] = useState<Assembly | null>(null)

  const deleteMut = useApiMutation(deleteAssembly, {
    successMessage: 'Assembly deleted',
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assembliesQueryKey })
      setToDelete(null)
    },
  })

  const handleEdit = (assembly: Assembly) => {
    setEditAssembly(assembly)
    setEditOpen(true)
  }

  const columns = useMemo(
    () => buildColumns(positionNameById, handleEdit, setToDelete),
    [positionNameById],
  )

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>Assemblies</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditAssembly(null)
            setEditOpen(true)
          }}
        >
          Add assembly
        </Button>
      </Stack>

      <DataTable<Assembly>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={(a) => navigate(`/assemblies/${a.id}`)}
      />

      <AssemblyForm open={editOpen} onClose={() => setEditOpen(false)} initial={editAssembly} />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete assembly"
        message={toDelete ? `Delete "${toDelete.name}"? This cannot be undone.` : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel="Delete"
        destructive
        busy={deleteMut.isPending}
      />
    </Box>
  )
}
