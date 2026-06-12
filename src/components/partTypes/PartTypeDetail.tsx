import { useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  partQuery,
  partTypeQuery,
  partsQueryKey,
  partTypesQueryKey,
  updatePart,
} from '@/api/parts'
import type { Part, PartPartTypeRelation } from '@/types/api'
import { bikeName, formatDate, formatDateTime, partIdentity } from '@/utils/formatters'
import { useApiMutation } from '@/hooks/useApiMutation'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { RelationForm } from '@/components/parts/RelationForm'
import { AddPartToTypeDialog } from './AddPartToTypeDialog'
import { ReusePartDialog } from './ReusePartDialog'

interface PartTypeDetailProps {
  open: boolean
  onClose: () => void
  partTypeId: string | null
}

const DRAWER_WIDTH = 620

const keyEq = (a: PartPartTypeRelation, b: PartPartTypeRelation) =>
  a.partTypeId === b.partTypeId && a.validFrom === b.validFrom

export const PartTypeDetail = ({
  open,
  onClose,
  partTypeId,
}: PartTypeDetailProps) => {
  const qc = useQueryClient()
  const { data: pt, isLoading } = useQuery({
    ...partTypeQuery(partTypeId ?? ''),
    enabled: !!partTypeId && open,
  })

  const [editRelation, setEditRelation] = useState<PartPartTypeRelation | null>(null)
  const [editPart, setEditPart] = useState<Part | null>(null)
  const [toDelete, setToDelete] = useState<PartPartTypeRelation | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [reuseRelation, setReuseRelation] = useState<PartPartTypeRelation | null>(null)

  // For the edit case we need the full part (backend sometimes returns nested parts without full data)
  const { data: editTargetPart } = useQuery({
    ...partQuery(editRelation?.partId ?? ''),
    enabled: !!editRelation?.partId,
  })

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: partsQueryKey })
    await qc.invalidateQueries({ queryKey: partTypesQueryKey })
  }

  const deleteMut = useApiMutation(
    async (relation: PartPartTypeRelation) => {
      // Fetch the owning part then PUT with the relation removed
      const owning = await qc.fetchQuery(partQuery(relation.partId))
      const next: Part = {
        ...owning,
        partTypeRelations: (owning.partTypeRelations ?? []).filter(
          (r) => !keyEq(r, relation),
        ),
      }
      return updatePart(owning.id, next)
    },
    {
      successMessage: 'Relation removed',
      onSuccess: () => {
        invalidate()
        setToDelete(null)
      },
    },
  )

  const relations = (pt?.partTypeRelations ?? [])
    .slice()
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))

  const openEditRelation = async (r: PartPartTypeRelation) => {
    setEditRelation(r)
    const p = await qc.fetchQuery(partQuery(r.partId))
    setEditPart(p)
  }

  const closeEditRelation = () => {
    setEditRelation(null)
    setEditPart(null)
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100vw', sm: DRAWER_WIDTH }, maxWidth: '100vw' } },
      }}
    >
      <Toolbar />
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: {
            xs: 'calc(100% - 56px)',
            sm: 'calc(100% - 64px)',
          },
        }}
      >
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
             {pt?.name ?? (isLoading ? 'Loading…' : 'Part Type')}
           </Typography>
           <IconButton onClick={onClose} aria-label="Close drawer">
             <CloseIcon />
           </IconButton>
         </Stack>

        {pt && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {pt.bike ? bikeName(pt.bike) : 'No bike assigned'}
            {pt.mandatory && ' · mandatory'}
          </Typography>
        )}

        <Divider />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Parts used as this type
          </Typography>
          {relations.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No parts assigned to this type yet.
            </Typography>
          )}
          {relations.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="none" sx={{ width: 48 }} />
                  <TableCell>Part</TableCell>
                  <TableCell>Valid From</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {relations.map((r) => {
                  const isActive = !r.validUntil
                  return (
                    <TableRow key={`${r.partId}-${r.validFrom}`}>
                      <TableCell padding="none" sx={{ pl: 1 }}>
                        {isActive ? null : (
                          <Tooltip title="Re-use this part (terminates current active part)">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.currentTarget.blur()
                                setReuseRelation(r)
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{partIdentity(r.part)}</TableCell>
                      <TableCell>{formatDate(r.validFrom)}</TableCell>
                      <TableCell>
                        {isActive ? (
                          <Typography component="span" color="success.main">
                            active
                          </Typography>
                        ) : (
                          formatDateTime(r.validUntil)
                        )}
                      </TableCell>
                       <TableCell align="right">
                         <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                           <Tooltip title="Edit relation">
                            <IconButton size="small" onClick={() => openEditRelation(r)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete relation">
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
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Box>

        <Box sx={{ pt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={(e) => {
              e.currentTarget.blur()
              setAddDialogOpen(true)
            }}
            disabled={!pt}
            fullWidth
          >
            Add new relation
          </Button>
        </Box>

        {pt && (
          <AddPartToTypeDialog
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            partType={pt}
          />
        )}

        {pt && (
          <ReusePartDialog
            open={!!reuseRelation}
            onClose={() => setReuseRelation(null)}
            partType={pt}
            relation={reuseRelation}
          />
        )}

        {editRelation && editTargetPart && editPart && (
          <RelationForm
            open={true}
            onClose={closeEditRelation}
            part={editPart}
            initial={editRelation}
            lockedPartTypeId={pt?.id}
          />
        )}

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
      </Box>
    </Drawer>
  )
}
