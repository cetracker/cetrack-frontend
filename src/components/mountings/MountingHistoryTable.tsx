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
import CachedIcon from '@mui/icons-material/Cached'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  onReuse?: (componentId: string) => void
  reuseComponentIds?: string[]
}

export const MountingHistoryTable = ({
  mountings,
  perspective,
  onReuse,
  reuseComponentIds,
}: MountingHistoryTableProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: bikes } = useQuery(bikesQuery())
  const { data: components } = useQuery(componentsQuery())
  const [toVoid, setToVoid] = useState<Mounting | null>(null)
  const [toCorrect, setToCorrect] = useState<Mounting | null>(null)

  const voidMut = useApiMutation(voidMounting, {
    successMessage: t('mountings.history.voidedSuccess'),
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

  const reuseIdSet = new Set(reuseComponentIds ?? [])
  const seenComponentIds = new Set<string>()

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        {t('mountings.history.empty')}
      </Typography>
    )
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            {onReuse && <TableCell />}
            <TableCell>
              {perspective === 'component'
                ? t('mountings.history.mountPointHeader')
                : t('components.list.columns.component')}
            </TableCell>
            <TableCell>{t('status.mounted')}</TableCell>
            <TableCell>{t('mountings.history.dismountedHeader')}</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((m) => {
            const locked = !!m.assemblyMountingId
            const showReuse =
              !!onReuse && !seenComponentIds.has(m.componentId) && reuseIdSet.has(m.componentId)
            seenComponentIds.add(m.componentId)
            return (
              <TableRow key={m.id}>
                {onReuse && (
                  <TableCell>
                    {showReuse && (
                      <Tooltip title={t('mountings.history.reuseTooltip')}>
                        <IconButton size="small" onClick={() => onReuse(m.componentId)}>
                          <CachedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
                <TableCell>{counterpart(m)}</TableCell>
                <TableCell>{formatDateTime(m.mountedAt)}</TableCell>
                <TableCell>
                  {m.dismountedAt ? (
                    formatDateTime(m.dismountedAt)
                  ) : (
                    <Chip label={t('mountings.history.activeChip')} color="success" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <Tooltip title={locked ? t('mountings.history.governedTooltip') : t('mountings.history.correctTooltip')}>
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
                    <Tooltip title={locked ? t('mountings.history.governedTooltip') : t('mountings.history.voidTooltip')}>
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
        title={t('mountings.history.voidTitle')}
        message={t('mountings.history.voidMessage')}
        onCancel={() => setToVoid(null)}
        onConfirm={() => toVoid && voidMut.mutate(toVoid.id)}
        confirmLabel={t('mountings.history.voidConfirm')}
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
