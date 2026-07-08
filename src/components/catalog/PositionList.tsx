import { useMemo, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { deletePosition, positionsQuery, positionsQueryKey } from '@/api/catalog'
import type { Position } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PositionForm } from './PositionForm'
import { formatDateTime } from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'

interface ActionsCellProps {
  position: Position
  onEdit: (position: Position) => void
  onDelete: (position: Position) => void
}

const ActionsCell = ({ position, onEdit, onDelete }: ActionsCellProps) => (
  <RowActions onEdit={() => onEdit(position)} onDelete={() => onDelete(position)} />
)

const buildColumns = (
  t: TFunction,
  onEdit: (position: Position) => void,
  onDelete: (position: Position) => void,
): ColumnDef<Position>[] => [
  { accessorKey: 'name', header: t('common.name') },
  {
    accessorKey: 'createdAt',
    header: t('common.created'),
    cell: (c) => formatDateTime(c.getValue<string | null>()),
    meta: { hideOnMobile: true },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <ActionsCell position={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
  },
]

export const PositionList = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery(positionsQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [toDelete, setToDelete] = useState<Position | null>(null)

  const deleteMut = useApiMutation(deletePosition, {
    successMessage: t('catalog.positionList.deletedSuccess'),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: positionsQueryKey })
      setToDelete(null)
    },
  })

  const handleEdit = (position: Position) => {
    setEditPosition(position)
    setEditOpen(true)
  }

  const columns = useMemo(() => buildColumns(t, handleEdit, setToDelete), [t])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h6' }}>{t('catalog.positionList.title')}</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditPosition(null)
            setEditOpen(true)
          }}
        >
          {t('catalog.positionList.addButton')}
        </Button>
      </Stack>

      <DataTable<Position>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={(position) => handleEdit(position)}
        fillHeight
      />

      <PositionForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editPosition}
      />

      <ConfirmDialog
        open={!!toDelete}
        title={t('catalog.positionList.deleteTitle')}
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
