import { useState } from 'react'
import {
  Chip,
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
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { invalidateAfterMountingChanges, voidMounting } from '@/api/mountings'
import { bikesQuery } from '@/api/bikes'
import { componentsQuery } from '@/api/components'
import type { Mounting } from '@/types/api'
import { bikeIdentity, componentIdentity, formatDateTime } from '@/utils/formatters'
import { CorrectMountingDialog } from './CorrectMountingDialog'

interface MountingHistoryTableProps {
  mountings: Mounting[]
  perspective: 'component' | 'bike'
}

export const MountingHistoryTable = ({
  mountings,
  perspective,
}: MountingHistoryTableProps) => {
  const qc = useQueryClient()
  const { data: bikes } = useQuery(bikesQuery())
  const { data: components } = useQuery(componentsQuery())
  const [toVoid, setToVoid] = useState<Mounting | null>(null)
  const [toCorrect, setToCorrect] = useState<Mounting | null>(null)

  const voidMut = useApiMutation(voidMounting, {
    successMessage: 'Mounting voided',
    onSuccess: async () => {
      await invalidateAfterMountingChanges(qc)
      setToVoid(null)
    },
  })

  const bikeMap = new Map((bikes ?? []).map((b) => [b.id, b]))
  const componentMap = new Map((components ?? []).map((c) => [c.id, c]))

  const counterpart = (m: Mounting): string =>
    perspective === 'component'
      ? [m.mountPointName, bikeIdentity(bikeMap.get(m.bikeId))].filter(Boolean).join(' · ')
      : componentIdentity(componentMap.get(m.componentId))

  const sorted = mountings.slice().sort((a, b) => b.mountedAt.localeCompare(a.mountedAt))

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No mountings yet.
      </Typography>
    )
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{perspective === 'component' ? 'Mount Point' : 'Component'}</TableCell>
            <TableCell>Mounted</TableCell>
            <TableCell>Dismounted</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((m) => {
            const locked = !!m.assemblyMountingId
            return (
              <TableRow key={m.id}>
                <TableCell>{counterpart(m)}</TableCell>
                <TableCell>{formatDateTime(m.mountedAt)}</TableCell>
                <TableCell>
                  {m.dismountedAt ? (
                    formatDateTime(m.dismountedAt)
                  ) : (
                    <Chip label="active" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <Tooltip title={locked ? 'Governed by an assembly mounting' : 'Correct'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={locked}
                          onClick={() => setToCorrect(m)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={locked ? 'Governed by an assembly mounting' : 'Void'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={locked}
                          onClick={() => setToVoid(m)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!toVoid}
        title="Void mounting"
        message="Void this mounting? The fact is erased, not closed. This cannot be undone."
        onCancel={() => setToVoid(null)}
        onConfirm={() => toVoid && voidMut.mutate(toVoid.id)}
        confirmLabel="Void"
        destructive
        busy={voidMut.isPending}
      />

      <CorrectMountingDialog
        open={!!toCorrect}
        onClose={() => setToCorrect(null)}
        mounting={toCorrect}
      />
    </>
  )
}
