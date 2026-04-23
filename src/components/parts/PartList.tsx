import { useMemo, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { partsQuery, partsQueryKey, deletePart } from '@/api/parts'
import type { Part } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PartForm } from './PartForm'
import { PartDetail } from './PartDetail'
import { formatDate, bikeName } from '@/utils/formatters'
import { useApiMutation } from '@/hooks/useApiMutation'

const currentUseAs = (p: Part): string => {
  const r = p.partTypeRelations?.find((rel) => !rel.validUntil)
  if (!r) return ''
  const bike = r.partType.bike ? ` on ${bikeName(r.partType.bike)}` : ''
  return `${r.partType.name}${bike}`
}

const lastUsedAt = (p: Part): string => {
  const sorted = p.partTypeRelations
    ?.slice()
    .sort((a, b) =>
      (b.validUntil ?? b.validFrom).localeCompare(a.validUntil ?? a.validFrom),
    )
  return formatDate(sorted?.[0]?.validUntil ?? sorted?.[0]?.validFrom)
}

export const PartList = () => {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery(partsQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'lastUsedAt', desc: false },
    { id: 'name', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editPart, setEditPart] = useState<Part | null>(null)
  const [toDelete, setToDelete] = useState<Part | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const deleteMut = useApiMutation(deletePart, {
    successMessage: 'Part deleted',
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: partsQueryKey })
      setToDelete(null)
    },
  })

  const openEdit = (part: Part) => {
    setEditPart(part)
    setEditOpen(true)
  }
  const openRelations = (part: Part) => {
    setDetailId(part.id)
    setDetailOpen(true)
  }

  const columns = useMemo<ColumnDef<Part>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'boughtAt',
        header: 'Purchase Date',
        cell: (c) => formatDate(c.getValue<string | null>()),
      },
      {
        accessorKey: 'retiredAt',
        header: 'Retired Date',
        cell: (c) => formatDate(c.getValue<string | null>()),
      },
      {
        id: 'currentUse',
        header: 'Currently In Use As',
        accessorFn: currentUseAs,
      },
      {
        id: 'lastUsedAt',
        header: 'Last Used @',
        accessorFn: lastUsedAt,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <RowActions
            onOpenRelations={() => openRelations(row.original)}
            onEdit={() => openEdit(row.original)}
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
        <Box sx={{ typography: 'h5' }}>Parts</Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditPart(null)
            setEditOpen(true)
          }}
        >
          Add part
        </Button>
      </Stack>

      <DataTable<Part>
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error ? { message: (error as { message?: string }).message ?? 'Failed to load' } : null}
        onRetry={() => refetch()}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        sorting={sorting}
        onSortingChange={setSorting}
        enableGrouping
        onRowClick={(p) => openEdit(p)}
      />

      <PartForm open={editOpen} onClose={() => setEditOpen(false)} initial={editPart} />

      <PartDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        partId={detailId}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete part"
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
