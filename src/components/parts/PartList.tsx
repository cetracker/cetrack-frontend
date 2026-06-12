import { useMemo, useState } from 'react'
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { partsQuery, partsQueryKey, deletePart } from '@/api/parts'
import type { Part } from '@/types/api'
import { DataTable } from '@/components/common/DataTable'
import { RowActions } from '@/components/common/RowActions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PartForm } from './PartForm'
import { PartDetail } from './PartDetail'
import { formatDate, bikeName, partDisambiguator, partIdentity } from '@/utils/formatters'
import { createErrorDisplay } from '@/utils/errors'
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

/** Part identity with a muted secondary disambiguation line and a hover/tap
 *  tooltip that shows the full detail (serial, vendor, price, dates). */
const PartInfoCell = ({ part }: { part: Part }) => {
  const price = part.purchasePrice
    ? `${part.purchasePrice} ${part.purchasePriceCurrency ?? ''}`.trim()
    : ''
  const details: [string, string][] = (
    [
      ['Manufacturer', part.manufacturer ?? ''],
      ['Model', part.model ?? ''],
      ['Serial', part.serialNumber ?? ''],
      ['Vendor', part.vendor ?? ''],
      ['Price', price],
      ['First used', formatDate(part.firstUsedDate)],
      ['Bought', formatDate(part.boughtAt)],
      ['Retired', formatDate(part.retiredAt)],
    ] as [string, string][]
  ).filter(([, v]) => v)

  const disambig = partDisambiguator(part)

  return (
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
      <Stack>
        <span>{partIdentity(part)}</span>
        {disambig && (
          <Typography variant="caption" color="text.secondary">
            {disambig}
          </Typography>
        )}
      </Stack>
      {details.length > 0 && (
        <Tooltip
          title={
            <Box sx={{ p: 0.5 }}>
              {details.map(([k, v]) => (
                <Stack
                  key={k}
                  sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {k}
                  </Typography>
                  <Typography variant="caption">{v}</Typography>
                </Stack>
              ))}
            </Box>
          }
          placement="right"
          enterTouchDelay={0}
          leaveTouchDelay={2000}
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 3,
                minWidth: 200,
                p: 1,
              },
            },
          }}
        >
          <IconButton
            size="small"
            aria-label="Part details"
            onClick={(e) => e.stopPropagation()}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}

interface PartActionsCellProps {
  part: Part
  onEdit: (part: Part) => void
  onDelete: (part: Part) => void
  onOpenRelations: (part: Part) => void
}

const PartActionsCell = ({ part, onEdit, onDelete, onOpenRelations }: PartActionsCellProps) => (
  <RowActions
    onOpenRelations={() => onOpenRelations(part)}
    onEdit={() => onEdit(part)}
    onDelete={() => onDelete(part)}
  />
)

const buildColumns = (
  onEdit: (part: Part) => void,
  onDelete: (part: Part) => void,
  onOpenRelations: (part: Part) => void,
): ColumnDef<Part>[] => [
  {
    id: 'identity',
    header: 'Part',
    accessorFn: (p) => partIdentity(p),
    cell: ({ row }) => <PartInfoCell part={row.original} />,
  },
  {
    accessorKey: 'boughtAt',
    header: 'Purchase Date',
    cell: (c) => formatDate(c.getValue<string | null>()),
    meta: { hideOnMobile: true },
  },
  {
    accessorKey: 'firstUsedDate',
    header: 'First Used',
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
    id: 'currentUse',
    header: 'Currently In Use As',
    accessorFn: currentUseAs,
  },
  {
    id: 'lastUsedAt',
    header: 'Last Used @',
    accessorFn: lastUsedAt,
    meta: { hideOnMobile: true },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: ({ row }) => (
      <PartActionsCell
        part={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
        onOpenRelations={onOpenRelations}
      />
    ),
  },
]

export const PartList = () => {
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery(partsQuery())

  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'lastUsedAt', desc: false },
    { id: 'identity', desc: false },
  ])

  const [editOpen, setEditOpen] = useState(false)
  const [editPart, setEditPart] = useState<Part | null>(null)
  const [toDelete, setToDelete] = useState<Part | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

   const deleteMut = useApiMutation(deletePart, {
     successMessage: 'Part deleted',
     onSuccess: async () => {
       await qc.invalidateQueries({ queryKey: partsQueryKey })
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

  const columns = useMemo(
    () => buildColumns(openEdit, setToDelete, openRelations),
    [],
  )

   return (
     <Box>
       <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
        error={createErrorDisplay(error)}
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
        message={toDelete ? `Delete "${partIdentity(toDelete)}"? This cannot be undone.` : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel="Delete"
        destructive
        busy={deleteMut.isPending}
      />
    </Box>
  )
}
