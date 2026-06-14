import { useMemo, useState } from 'react'
import { Box, Button, Checkbox, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import {
  deletePartType,
  partTypesQuery,
  partTypesQueryKey,
} from '@/api/parts'
import type { PartType } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PartInfoCell } from '@/components/parts/PartInfoCell'
import { PartTypeForm } from './PartTypeForm'
import { PartTypeDetail } from './PartTypeDetail'
import { bikeName, partIdentity } from '@/utils/formatters'
import { useApiMutation } from '@/hooks/useApiMutation'

const currentPartName = (pt: PartType): string =>
  partIdentity(pt.partTypeRelations?.find((r) => !r.validUntil)?.part)

const MandatoryCell = ({ pt }: { pt: PartType }) => {
  const hasActive = pt.partTypeRelations?.some((r) => !r.validUntil)
  const missing = pt.mandatory && !hasActive
  return (
    <Checkbox
      checked={pt.mandatory}
      disabled
      size="small"
      sx={{
        p: 0,
        color: missing ? 'error.main' : undefined,
        '&.Mui-checked': missing ? { color: 'error.main' } : undefined,
      }}
    />
  )
}

const CurrentPartCell = ({ pt }: { pt: PartType }) => {
  const activePart = pt.partTypeRelations?.find((r) => !r.validUntil)?.part
  if (activePart && partIdentity(activePart)) return <PartInfoCell part={activePart} />
  if (pt.mandatory)
    return (
      <Typography component="span" color="error.main">
        — none —
      </Typography>
    )
  return null
}

interface PartTypeActionsCellProps {
  pt: PartType
  onEdit: (pt: PartType) => void
  onDelete: (pt: PartType) => void
  onOpenRelations: (pt: PartType) => void
}

const PartTypeActionsCell = ({ pt, onEdit, onDelete, onOpenRelations }: PartTypeActionsCellProps) => (
  <RowActions
    onOpenRelations={() => onOpenRelations(pt)}
    onEdit={() => onEdit(pt)}
    onDelete={() => onDelete(pt)}
  />
)

const buildColumns = (
  onEdit: (pt: PartType) => void,
  onDelete: (pt: PartType) => void,
  onOpenRelations: (pt: PartType) => void,
): ColumnDef<PartType>[] => [
  { accessorKey: 'name', header: 'Name' },
  {
    id: 'mandatory',
    header: 'Mandatory',
    accessorFn: (pt) => pt.mandatory,
    enableGlobalFilter: false,
    meta: { hideOnMobile: true },
    cell: ({ row }) => <MandatoryCell pt={row.original} />,
  },
  {
    id: 'bike',
    header: 'Bike',
    accessorFn: (pt) => bikeName(pt.bike),
    enableGrouping: true,
  },
  {
    id: 'currentPart',
    header: 'Currently Used Part',
    accessorFn: currentPartName,
    meta: { hideOnMobile: true },
    cell: ({ row }) => <CurrentPartCell pt={row.original} />,
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <PartTypeActionsCell
        pt={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenRelations={onOpenRelations}
      />
    ),
  },
]

export const PartTypeList = () => {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery(partTypesQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'bike', desc: false },
    { id: 'name', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editPt, setEditPt] = useState<PartType | null>(null)
  const [toDelete, setToDelete] = useState<PartType | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

   const deleteMut = useApiMutation(deletePartType, {
     successMessage: 'Part type deleted',
     onSuccess: async () => {
       await qc.invalidateQueries({ queryKey: partTypesQueryKey })
       setToDelete(null)
     },
   })

  const openEdit = (pt: PartType) => {
    setEditPt(pt)
    setEditOpen(true)
  }

  const openRelations = (pt: PartType) => {
    setDetailId(pt.id)
    setDetailOpen(true)
  }

  const columns = useMemo(
    () => buildColumns(openEdit, setToDelete, openRelations),

    [],
  )

   return (
     <Box>
       <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
         <Box sx={{ typography: 'h5' }}>Part Types</Box>
         <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditPt(null)
            setEditOpen(true)
          }}
        >
          Add part type
        </Button>
      </Stack>

      <DataTable<PartType>
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
        onRowClick={(pt) => openEdit(pt)}
      />

      <PartTypeForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={editPt}
      />

      <PartTypeDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        partTypeId={detailId}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete part type"
        message={
          toDelete ? `Delete "${toDelete.name}"? This cannot be undone.` : ''
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
