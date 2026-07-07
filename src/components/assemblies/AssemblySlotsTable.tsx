import { useState } from 'react'
import {
  Box,
  Button,
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
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import HistoryIcon from '@mui/icons-material/History'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { deleteAssemblySlot, assemblyQueryKey } from '@/api/assemblies'
import { componentTypesQuery } from '@/api/catalog'
import { componentsQuery } from '@/api/components'
import type { Assembly, AssemblySlot } from '@/types/api'
import { componentIdentity, formatDateTime } from '@/utils/formatters'
import { AssemblySlotForm } from './AssemblySlotForm'
import { SlotMemberHistoryDrawer } from './SlotMemberHistoryDrawer'
import { RemoveMemberDialog } from './RemoveMemberDialog'

interface AssemblySlotsTableProps {
  assembly: Assembly
}

export const AssemblySlotsTable = ({ assembly }: AssemblySlotsTableProps) => {
  const qc = useQueryClient()
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const { data: components } = useQuery(componentsQuery())

  const [formOpen, setFormOpen] = useState(false)
  const [editSlot, setEditSlot] = useState<AssemblySlot | null>(null)
  const [toDelete, setToDelete] = useState<AssemblySlot | null>(null)
  const [historySlot, setHistorySlot] = useState<AssemblySlot | null>(null)
  const [removeMemberComponentId, setRemoveMemberComponentId] = useState<string | null>(null)

  const typeNameById = new Map((componentTypes ?? []).map((t) => [t.id, t.name]))
  const componentById = new Map((components ?? []).map((c) => [c.id, c]))

  const deleteMut = useApiMutation(
    (slotId: string) => deleteAssemblySlot(assembly.id, slotId),
    {
      successMessage: 'Slot deleted',
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: assemblyQueryKey(assembly.id) })
        setToDelete(null)
      },
    },
  )

  const rows = assembly.slots.slice().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditSlot(null)
            setFormOpen(true)
          }}
        >
          Add slot
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          No slots yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Slot</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Valid from</TableCell>
              <TableCell>Valid to</TableCell>
              <TableCell>Member</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((slot) => {
              const member = slot.memberComponentId
                ? componentById.get(slot.memberComponentId)
                : undefined
              return (
                <TableRow key={slot.id}>
                  <TableCell>{slot.name}</TableCell>
                  <TableCell>{typeNameById.get(slot.componentTypeId) ?? ''}</TableCell>
                  <TableCell>{formatDateTime(slot.validFrom)}</TableCell>
                  <TableCell>{slot.validTo ? formatDateTime(slot.validTo) : ''}</TableCell>
                  <TableCell>
                    {member ? (
                      <>
                        {componentIdentity(member)}{' '}
                        <Typography component="span" variant="caption" color="text.secondary">
                          since {formatDateTime(slot.memberFrom)}
                        </Typography>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Tooltip title="Member history">
                        <IconButton size="small" onClick={() => setHistorySlot(slot)}>
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {slot.memberComponentId && (
                        <Tooltip title="Remove member">
                          <IconButton
                            size="small"
                            onClick={() => setRemoveMemberComponentId(slot.memberComponentId!)}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit slot">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditSlot(slot)
                            setFormOpen(true)
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete slot">
                        <IconButton size="small" color="error" onClick={() => setToDelete(slot)}>
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

      <AssemblySlotForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        assemblyId={assembly.id}
        initial={editSlot}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete slot"
        message={toDelete ? `Delete "${toDelete.name}"? This cannot be undone.` : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        confirmLabel="Delete"
        destructive
        busy={deleteMut.isPending}
      />

      <SlotMemberHistoryDrawer
        open={!!historySlot}
        onClose={() => setHistorySlot(null)}
        assemblyId={assembly.id}
        assembly={assembly}
        slot={historySlot}
      />

      {removeMemberComponentId && (
        <RemoveMemberDialog
          open={!!removeMemberComponentId}
          onClose={() => setRemoveMemberComponentId(null)}
          assemblyId={assembly.id}
          componentId={removeMemberComponentId}
        />
      )}
    </Box>
  )
}
