import { useMemo, useState } from 'react'
import { Box, Button, Chip, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
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
  t: TFunction,
  positionNameById: Map<string, string>,
  onEdit: (assembly: Assembly) => void,
  onDelete: (assembly: Assembly) => void,
): ColumnDef<Assembly>[] => [
  { accessorKey: 'name', header: t('common.name') },
  {
    id: 'position',
    header: t('common.position'),
    accessorFn: (a) => (a.positionId ? positionNameById.get(a.positionId) ?? '' : ''),
  },
  {
    id: 'complete',
    header: t('assemblies.list.completeChip'),
    accessorFn: (a) => a.complete,
    cell: (c) => (
      <Chip
        size="small"
        label={c.getValue<boolean>() ? t('assemblies.list.completeChip') : t('assemblies.list.incompleteChip')}
        color={c.getValue<boolean>() ? 'success' : 'default'}
      />
    ),
  },
  {
    id: 'mounted',
    header: t('status.mounted'),
    accessorFn: (a) => a.mounted,
    cell: (c) => (
      <Chip
        size="small"
        label={c.getValue<boolean>() ? t('status.mounted') : t('assemblies.list.unmountedChip')}
        color={c.getValue<boolean>() ? 'primary' : 'default'}
      />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: t('common.created'),
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
  const { t } = useTranslation()
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
    successMessage: t('assemblies.list.deletedSuccess'),
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
    () => buildColumns(t, positionNameById, handleEdit, setToDelete),
    [t, positionNameById],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>{t('assemblies.list.title')}</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditAssembly(null)
            setEditOpen(true)
          }}
        >
          {t('assemblies.list.addButton')}
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
        fillHeight
      />

      <AssemblyForm open={editOpen} onClose={() => setEditOpen(false)} initial={editAssembly} />

      <ConfirmDialog
        open={!!toDelete}
        title={t('assemblies.list.deleteTitle')}
        message={toDelete ? t('common.deleteConfirmMessage', { name: toDelete.name }) : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel={t('common.delete')}
        destructive
        busy={deleteMut.isPending}
      />
    </Box>
  )
}
