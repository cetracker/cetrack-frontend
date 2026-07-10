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
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  assemblyMountingsQuery,
  invalidateAfterAssemblyMountingChanges,
  voidAssemblyMounting,
} from '@/api/assemblies'
import { bikesQuery } from '@/api/bikes'
import type { AssemblyMounting } from '@/types/api'
import { bikeIdentity, formatDateTime } from '@/utils/formatters'
import { CorrectAssemblyMountingDialog } from './CorrectAssemblyMountingDialog'

interface AssemblyMountingHistoryTableProps {
  assemblyId: string
}

export const AssemblyMountingHistoryTable = ({
  assemblyId,
}: AssemblyMountingHistoryTableProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: mountings } = useQuery(assemblyMountingsQuery(assemblyId))
  const { data: bikes } = useQuery(bikesQuery())
  const [toVoid, setToVoid] = useState<AssemblyMounting | null>(null)
  const [toCorrect, setToCorrect] = useState<AssemblyMounting | null>(null)

  const voidMut = useApiMutation(
    (mountingId: string) => voidAssemblyMounting(assemblyId, mountingId),
    {
      successMessage: t('assemblies.mountingHistory.voidedSuccess'),
      onSuccess: async () => {
        await invalidateAfterAssemblyMountingChanges(qc, assemblyId)
        setToVoid(null)
      },
    },
  )

  const bikeMap = new Map((bikes ?? []).map((b) => [b.id, b]))
  const sorted = (mountings ?? []).slice().sort((a, b) => b.mountedAt.localeCompare(a.mountedAt))

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        {t('assemblies.mountingHistory.empty')}
      </Typography>
    )
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('common.bike')}</TableCell>
            <TableCell>{t('status.mounted')}</TableCell>
            <TableCell>{t('mountings.history.dismountedHeader')}</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{bikeIdentity(bikeMap.get(m.bikeId))}</TableCell>
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
                  <Tooltip title={t('assemblies.mountingHistory.correctTooltip')}>
                    <IconButton size="small" onClick={() => setToCorrect(m)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('assemblies.mountingHistory.voidTooltip')}>
                    <IconButton size="small" color="error" onClick={() => setToVoid(m)}>
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
        open={!!toVoid}
        title={t('assemblies.mountingHistory.voidTitle')}
        message={t('assemblies.mountingHistory.voidMessage')}
        onCancel={() => setToVoid(null)}
        onConfirm={() => toVoid && voidMut.mutate(toVoid.id)}
        confirmLabel={t('assemblies.mountingHistory.voidConfirm')}
        destructive
        busy={voidMut.isPending}
      />

      <CorrectAssemblyMountingDialog
        open={!!toCorrect}
        onClose={() => setToCorrect(null)}
        assemblyId={assemblyId}
        mounting={toCorrect}
      />
    </>
  )
}
