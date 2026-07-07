import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  deleteMountPoint,
  mountPointsQuery,
  mountPointsQueryKey,
} from '@/api/bikes'
import { componentTypesQuery, positionsQuery } from '@/api/catalog'
import { componentsQuery } from '@/api/components'
import { mountingsQuery } from '@/api/mountings'
import type { MountPoint } from '@/types/api'
import { componentIdentity, formatDateTime } from '@/utils/formatters'
import { activeMounting } from '@/utils/components'
import { MountPointForm } from './MountPointForm'
import { MountPointHistoryDrawer } from './MountPointHistoryDrawer'
import { DismountDialog } from '@/components/components/DismountDialog'

interface CompositionTableProps {
  bikeId: string
}

export const CompositionTable = ({ bikeId }: CompositionTableProps) => {
  const qc = useQueryClient()
  const now = useMemo(() => new Date().toISOString(), [])

  const { data: mountPoints } = useQuery(mountPointsQuery(bikeId))
  const { data: activeMountings } = useQuery(mountingsQuery({ bikeId, activeAt: now }))
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const { data: positions } = useQuery(positionsQuery())
  const { data: components } = useQuery(componentsQuery())

  const [formOpen, setFormOpen] = useState(false)
  const [editMountPoint, setEditMountPoint] = useState<MountPoint | null>(null)
  const [historyTarget, setHistoryTarget] = useState<MountPoint | null>(null)
  const [dismountComponentId, setDismountComponentId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<MountPoint | null>(null)

  const typeNameById = new Map((componentTypes ?? []).map((ct) => [ct.id, ct.name]))
  const positionNameById = new Map((positions ?? []).map((p) => [p.id, p.name]))
  const componentById = new Map((components ?? []).map((c) => [c.id, c]))

  const deleteMut = useApiMutation(
    (mpId: string) => deleteMountPoint(bikeId, mpId),
    {
      successMessage: 'Mount point deleted',
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: mountPointsQueryKey(bikeId) })
        setToDelete(null)
      },
    },
  )

  const rows = (mountPoints ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Box>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditMountPoint(null)
            setFormOpen(true)
          }}
        >
          Add mount point
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          No mount points yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Mandatory</TableCell>
              <TableCell>Mounted</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((mp) => {
              const active = activeMounting(
                (activeMountings ?? []).filter((m) => m.mountPointId === mp.id),
              )
              const mountedComponent = active ? componentById.get(active.componentId) : undefined
              return (
                <TableRow key={mp.id}>
                  <TableCell>{mp.name}</TableCell>
                  <TableCell>{typeNameById.get(mp.componentTypeId) ?? ''}</TableCell>
                  <TableCell>{mp.positionId ? positionNameById.get(mp.positionId) ?? '' : ''}</TableCell>
                  <TableCell>
                    <Checkbox checked={mp.mandatory} disabled size="small" sx={{ p: 0 }} />
                  </TableCell>
                  <TableCell>
                    {active && mountedComponent ? (
                      <>
                        {componentIdentity(mountedComponent)}{' '}
                        <Typography component="span" variant="caption" color="text.secondary">
                          since {formatDateTime(active.mountedAt)}
                        </Typography>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Tooltip title={active ? 'Swap' : 'Mount'}>
                        <IconButton size="small" onClick={() => setHistoryTarget(mp)}>
                          <SwapHorizIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {active && (
                        <Tooltip title="Dismount">
                          <IconButton
                            size="small"
                            onClick={() => setDismountComponentId(active.componentId)}
                          >
                            <LinkOffIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditMountPoint(mp)
                            setFormOpen(true)
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setToDelete(mp)}>
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

      <MountPointForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        bikeId={bikeId}
        initial={editMountPoint}
      />

      <MountPointHistoryDrawer
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        bikeId={bikeId}
        mountPoint={historyTarget}
      />

      {dismountComponentId && (
        <DismountDialog
          open={!!dismountComponentId}
          onClose={() => setDismountComponentId(null)}
          componentId={dismountComponentId}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete mount point"
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
