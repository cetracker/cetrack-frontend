import { useMemo, useState } from 'react'
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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      successMessage: t('bikes.composition.deletedSuccess'),
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: mountPointsQueryKey(bikeId) })
        setToDelete(null)
      },
    },
  )

  const rows = (mountPoints ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
  const mountingsLoaded = activeMountings !== undefined

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
          {t('bikes.composition.addButton')}
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          {t('bikes.composition.empty')}
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('common.name')}</TableCell>
              <TableCell>{t('common.type')}</TableCell>
              <TableCell>{t('common.position')}</TableCell>
              <TableCell>{t('common.mandatory')}</TableCell>
              <TableCell>{t('status.mounted')}</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((mp) => {
              const active = activeMounting(
                (activeMountings ?? []).filter((m) => m.mountPointId === mp.id),
              )
              const mountedComponent = active ? componentById.get(active.componentId) : undefined
              const isMounted = !!active
              return (
                <TableRow key={mp.id}>
                  <TableCell>{mp.name}</TableCell>
                  <TableCell>{typeNameById.get(mp.componentTypeId) ?? ''}</TableCell>
                  <TableCell>{mp.positionId ? positionNameById.get(mp.positionId) ?? '' : ''}</TableCell>
                  <TableCell>
                    {mp.mandatory && mountingsLoaded && (
                      isMounted ? (
                        <CheckBoxIcon
                          fontSize="small"
                          sx={{ color: 'text.disabled' }}
                          titleAccess={t('common.mandatory')}
                        />
                      ) : (
                        <Tooltip title={t('bikes.composition.mandatoryEmptyTooltip')}>
                          <WarningAmberIcon
                            color="warning"
                            fontSize="small"
                            titleAccess={t('bikes.composition.mandatoryEmptyTooltip')}
                          />
                        </Tooltip>
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {active && mountedComponent ? (
                      <>
                        {componentIdentity(mountedComponent)}{' '}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {t('bikes.composition.sincePrefix', { date: formatDateTime(active.mountedAt) })}
                        </Typography>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Tooltip title={active ? t('bikes.composition.swapTooltip') : t('components.detail.mountButton')}>
                        <IconButton size="small" onClick={() => setHistoryTarget(mp)}>
                          <SwapHorizIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {active && (
                        <Tooltip title={t('components.detail.dismountButton')}>
                          <IconButton
                            size="small"
                            onClick={() => setDismountComponentId(active.componentId)}
                          >
                            <LinkOffIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('common.edit')}>
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
                      <Tooltip title={t('common.delete')}>
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
        title={t('bikes.composition.deleteTitle')}
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
