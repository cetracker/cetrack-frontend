import { useMemo, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  componentTypesQuery,
  componentTypesQueryKey,
  deleteComponentType,
} from '@/api/catalog'
import type { ComponentType } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ComponentTypeForm } from './ComponentTypeForm'
import { formatDateTime } from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'

interface ActionsCellProps {
  ct: ComponentType
  onEdit: (ct: ComponentType) => void
  onDelete: (ct: ComponentType) => void
}

const ActionsCell = ({ ct, onEdit, onDelete }: ActionsCellProps) => (
  <RowActions onEdit={() => onEdit(ct)} onDelete={() => onDelete(ct)} />
)

const buildColumns = (
  t: TFunction,
  onEdit: (ct: ComponentType) => void,
  onDelete: (ct: ComponentType) => void,
): ColumnDef<ComponentType>[] => [
  { accessorKey: 'name', header: t('common.name') },
  { accessorKey: 'description', header: t('common.description') },
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
      <ActionsCell ct={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
  },
]

export const ComponentTypeList = () => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery(componentTypesQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editComponentType, setEditComponentType] = useState<ComponentType | null>(null)
  const [toDelete, setToDelete] = useState<ComponentType | null>(null)

  const deleteMut = useApiMutation(deleteComponentType, {
    successMessage: t('catalog.componentTypeList.deletedSuccess'),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: componentTypesQueryKey })
      setToDelete(null)
    },
  })

  const handleEdit = (ct: ComponentType) => {
    setEditComponentType(ct)
    setEditOpen(true)
  }

  const columns = useMemo(() => buildColumns(t, handleEdit, setToDelete), [t])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h6' }}>{t('catalog.componentTypeList.title')}</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditComponentType(null)
            setEditOpen(true)
          }}
        >
          {t('catalog.componentTypeList.addButton')}
        </Button>
      </Stack>

      <DataTable<ComponentType>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={(ct) => handleEdit(ct)}
        fillHeight
      />

      <ComponentTypeForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editComponentType}
      />

      <ConfirmDialog
        open={!!toDelete}
        title={t('catalog.componentTypeList.deleteTitle')}
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
