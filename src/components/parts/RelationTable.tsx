import { useState } from 'react'
import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { formatDate } from '@/utils/formatters'
import type { Part, PartPartTypeRelation } from '@/types/api'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  partQueryKey,
  partsQueryKey,
  updatePart,
} from '@/api/parts'
import { useQueryClient } from '@tanstack/react-query'
import { bikeName } from '@/utils/formatters'

interface RelationTableProps {
  part: Part
  /** Called to request an edit — parent handles the dialog. */
  onEdit: (relation: PartPartTypeRelation) => void
  mode?: 'part' | 'partType'
}

type Key = { partTypeId: string; validFrom: string }
const keyOf = (r: PartPartTypeRelation): Key => ({
  partTypeId: r.partTypeId,
  validFrom: r.validFrom,
})
const keyEq = (a: Key, b: Key) =>
  a.partTypeId === b.partTypeId && a.validFrom === b.validFrom

export const RelationTable = ({ part, onEdit, mode = 'part' }: RelationTableProps) => {
  const qc = useQueryClient()
  const [toDelete, setToDelete] = useState<PartPartTypeRelation | null>(null)

  const deleteMut = useApiMutation(
    (relation: PartPartTypeRelation) => {
      const next: Part = {
        ...part,
        partTypeRelations: (part.partTypeRelations ?? []).filter(
          (r) => !keyEq(keyOf(r), keyOf(relation)),
        ),
      }
      return updatePart(part.id, next)
    },
    {
      successMessage: 'Relation removed',
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: partsQueryKey })
        qc.invalidateQueries({ queryKey: partQueryKey(part.id) })
        setToDelete(null)
      },
    },
  )

  const relations = (part.partTypeRelations ?? []).slice().sort((a, b) =>
    b.validFrom.localeCompare(a.validFrom),
  )

  if (relations.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No relations yet.
      </Typography>
    )
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              {mode === 'part' ? 'Part Type' : 'Part'}
            </TableCell>
            <TableCell>Bike</TableCell>
            <TableCell>Valid From</TableCell>
            <TableCell>Valid Until</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {relations.map((r) => (
            <TableRow key={`${r.partTypeId}-${r.validFrom}`}>
              <TableCell>
                {mode === 'part' ? r.partType.name : r.part.name}
              </TableCell>
              <TableCell>{bikeName(r.partType.bike)}</TableCell>
              <TableCell>{formatDate(r.validFrom)}</TableCell>
              <TableCell>
                {r.validUntil ? formatDate(r.validUntil) : (
                  <Typography component="span" color="success.main">active</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(r)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setToDelete(r)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete relation"
        message="Remove this relation? This cannot be undone."
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete)}
        confirmLabel="Delete"
        destructive
        busy={deleteMut.isPending}
      />
    </>
  )
}
