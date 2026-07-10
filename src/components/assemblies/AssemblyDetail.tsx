import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Chip, Stack, Tab, Tabs } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { assemblyQuery, assembliesQueryKey, deleteAssembly } from '@/api/assemblies'
import { positionsQuery } from '@/api/catalog'
import { AssemblyForm } from './AssemblyForm'
import { AssemblySlotsTable } from './AssemblySlotsTable'
import { AssemblyMountingHistoryTable } from './AssemblyMountingHistoryTable'
import { AssemblyMembershipSnapshot } from './AssemblyMembershipSnapshot'
import { MountAssemblyDialog } from './MountAssemblyDialog'
import { DismountAssemblyDialog } from './DismountAssemblyDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'

export const AssemblyDetail = () => {
  const { t } = useTranslation()
  const { assemblyId } = useParams<{ assemblyId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: assembly, isLoading } = useQuery({
    ...assemblyQuery(assemblyId ?? ''),
    enabled: !!assemblyId,
  })
  const { data: positions } = useQuery(positionsQuery())

  const [tab, setTab] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [toDelete, setToDelete] = useState(false)
  const [mountOpen, setMountOpen] = useState(false)
  const [dismountOpen, setDismountOpen] = useState(false)

  const deleteMut = useApiMutation(deleteAssembly, {
    successMessage: t('assemblies.list.deletedSuccess'),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assembliesQueryKey })
      navigate('/assemblies')
    },
  })

  if (!assemblyId) return null

  const positionName = assembly?.positionId
    ? (positions ?? []).find((p) => p.id === assembly.positionId)?.name
    : undefined

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/assemblies')}
        size="small"
        sx={{ mb: 1 }}
      >
        {t('assemblies.detail.backButton')}
      </Button>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ typography: 'h5' }}>
            {assembly?.name ?? (isLoading ? t('common.loading') : t('assemblies.detail.fallbackTitle'))}
          </Box>
          {positionName && <Chip size="small" label={positionName} />}
          {assembly && (
            <>
              <Chip
                size="small"
                label={assembly.complete ? t('assemblies.list.completeChip') : t('assemblies.list.incompleteChip')}
                color={assembly.complete ? 'success' : 'default'}
              />
              <Chip
                size="small"
                label={assembly.mounted ? t('status.mounted') : t('assemblies.list.unmountedChip')}
                color={assembly.mounted ? 'primary' : 'default'}
              />
            </>
          )}
        </Stack>
        {assembly && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              {t('common.edit')}
            </Button>
            <Button variant="outlined" color="error" onClick={() => setToDelete(true)}>
              {t('common.delete')}
            </Button>
            <Button
              variant="contained"
              disabled={assembly.mounted}
              onClick={() => setMountOpen(true)}
            >
              {t('assemblies.detail.mountButton')}
            </Button>
            <Button
              variant="outlined"
              disabled={!assembly.mounted}
              onClick={() => setDismountOpen(true)}
            >
              {t('components.detail.dismountButton')}
            </Button>
          </Stack>
        )}
      </Stack>

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={t('assemblies.detail.slotsTab')} />
        <Tab label={t('assemblies.detail.historyTab')} />
      </Tabs>

      {assembly &&
        (tab === 0 ? (
          <AssemblySlotsTable assembly={assembly} />
        ) : (
          <>
            <AssemblyMembershipSnapshot assemblyId={assemblyId} />
            <AssemblyMountingHistoryTable assemblyId={assemblyId} />
          </>
        ))}

      {assembly && (
        <>
          <AssemblyForm open={editOpen} onClose={() => setEditOpen(false)} initial={assembly} />
          <ConfirmDialog
            open={toDelete}
            title={t('assemblies.list.deleteTitle')}
            message={t('common.deleteConfirmMessage', { name: assembly.name })}
            onCancel={() => setToDelete(false)}
            onConfirm={() => deleteMut.mutate(assemblyId)}
            confirmLabel={t('common.delete')}
            destructive
            busy={deleteMut.isPending}
          />
          <MountAssemblyDialog
            open={mountOpen}
            onClose={() => setMountOpen(false)}
            assembly={assembly}
          />
          <DismountAssemblyDialog
            open={dismountOpen}
            onClose={() => setDismountOpen(false)}
            assemblyId={assembly.id}
          />
        </>
      )}
    </Box>
  )
}
