import { useMemo, useState } from 'react'
import { Box, Button, Chip, MenuItem, Stack, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { componentsQuery, componentsQueryKey, deleteComponent } from '@/api/components'
import { componentTypesQuery } from '@/api/catalog'
import { mountingsQuery } from '@/api/mountings'
import { bikesQuery } from '@/api/bikes'
import type { Component, ComponentStatus } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ComponentForm } from './ComponentForm'
import { ComponentDetail } from './ComponentDetail'
import { ComponentInfoCell } from './ComponentInfoCell'
import { useTranslation } from 'react-i18next'
import { bikeIdentity, componentIdentity, formatDate } from '@/utils/formatters'
import { statusLabels, componentStatusLabel } from '@/utils/components'
import { createErrorDisplay } from '@/utils/errors'
import { useApiMutation } from '@/hooks/useApiMutation'

interface ActionsCellProps {
  component: Component
  onEdit: (component: Component) => void
  onDelete: (component: Component) => void
  onOpenDetail: (component: Component) => void
}

const ActionsCell = ({ component, onEdit, onDelete, onOpenDetail }: ActionsCellProps) => (
  <RowActions
    onOpenRelations={() => onOpenDetail(component)}
    relationsLabel="Show details"
    onEdit={() => onEdit(component)}
    onDelete={() => onDelete(component)}
  />
)

const buildColumns = (
  typeNameById: Map<string, string>,
  usageByComponentId: Map<string, string>,
  onEdit: (component: Component) => void,
  onDelete: (component: Component) => void,
  onOpenDetail: (component: Component) => void,
): ColumnDef<Component>[] => [
  {
    id: 'identity',
    header: 'Component',
    accessorFn: (c) => componentIdentity(c),
    cell: ({ row }) => <ComponentInfoCell component={row.original} />,
  },
  {
    id: 'componentType',
    header: 'Type',
    accessorFn: (c) => typeNameById.get(c.componentTypeId) ?? '',
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (c) => c.status ?? '',
    cell: ({ row }) =>
      row.original.status ? <Chip label={componentStatusLabel(row.original)} size="small" /> : null,
  },
  {
    id: 'currentUsage',
    header: 'Currently In Use As',
    accessorFn: (c) => usageByComponentId.get(c.id) ?? '',
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Purchase Date',
    cell: (c) => formatDate(c.getValue<string | null>()),
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: 'retiredAt',
    header: 'Retired Date',
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
        component={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenDetail={onOpenDetail}
      />
    ),
  },
]

export const ComponentList = () => {
  useTranslation()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<ComponentStatus | ''>('')
  const { data, isLoading, error, refetch } = useQuery(
    componentsQuery(statusFilter ? { status: statusFilter } : {}),
  )
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const typeNameById = useMemo(
    () => new Map((componentTypes ?? []).map((ct) => [ct.id, ct.name])),
    [componentTypes],
  )

  const { data: mountings } = useQuery(mountingsQuery({}))
  const { data: bikes } = useQuery(bikesQuery())
  const bikeById = useMemo(
    () => new Map((bikes ?? []).map((b) => [b.id, b])),
    [bikes],
  )
  const usageByComponentId = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of mountings ?? []) {
      if (m.dismountedAt) continue
      const bike = bikeById.get(m.bikeId)
      if (!bike) continue
      map.set(m.componentId, `${m.mountPointName} on ${bikeIdentity(bike)}`)
    }
    return map
  }, [mountings, bikeById])

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'identity', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editComponent, setEditComponent] = useState<Component | null>(null)
  const [toDelete, setToDelete] = useState<Component | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const deleteMut = useApiMutation(deleteComponent, {
    successMessage: 'Component deleted',
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: componentsQueryKey() })
      setToDelete(null)
    },
  })

  const openEdit = (component: Component) => {
    setEditComponent(component)
    setEditOpen(true)
  }

  const openDetail = (component: Component) => {
    setDetailId(component.id)
    setDetailOpen(true)
  }

  const columns = useMemo(
    () => buildColumns(typeNameById, usageByComponentId, openEdit, setToDelete, openDetail),
    [typeNameById, usageByComponentId],
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>Components</Box>
        <Stack sx={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ComponentStatus | '')}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {Object.entries(statusLabels()).map(([s, label]) => (
              <MenuItem key={s} value={s}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditComponent(null)
              setEditOpen(true)
            }}
          >
            Add component
          </Button>
        </Stack>
      </Stack>

      <DataTable<Component>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={createErrorDisplay(error)}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={(c) => openDetail(c)}
        fillHeight
      />

      <ComponentForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editComponent}
      />

      <ComponentDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        componentId={detailId}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete component"
        message={
          toDelete
            ? `Delete "${componentIdentity(toDelete)}"? This cannot be undone.`
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
