import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Chip, Stack, Tab, Tabs } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { assemblyQuery, assembliesQueryKey, deleteAssembly } from '@/api/assemblies'
import { positionsQuery } from '@/api/catalog'
import { AssemblyForm } from './AssemblyForm'
import { AssemblySlotsTable } from './AssemblySlotsTable'
import { AssemblyMountingHistoryTable } from './AssemblyMountingHistoryTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useApiMutation } from '@/hooks/useApiMutation'

export const AssemblyDetail = () => {
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

  const deleteMut = useApiMutation(deleteAssembly, {
    successMessage: 'Assembly deleted',
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
        Back to assemblies
      </Button>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ typography: 'h5' }}>
            {assembly?.name ?? (isLoading ? 'Loading…' : 'Assembly')}
          </Box>
          {positionName && <Chip size="small" label={positionName} />}
          {assembly && (
            <>
              <Chip
                size="small"
                label={assembly.complete ? 'Complete' : 'Incomplete'}
                color={assembly.complete ? 'success' : 'default'}
              />
              <Chip
                size="small"
                label={assembly.mounted ? 'Mounted' : 'Unmounted'}
                color={assembly.mounted ? 'primary' : 'default'}
              />
            </>
          )}
        </Stack>
        {assembly && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="outlined" color="error" onClick={() => setToDelete(true)}>
              Delete
            </Button>
          </Stack>
        )}
      </Stack>

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Slots & Members" />
        <Tab label="Mounting History" />
      </Tabs>

      {assembly &&
        (tab === 0 ? (
          <AssemblySlotsTable assembly={assembly} />
        ) : (
          <AssemblyMountingHistoryTable assemblyId={assemblyId} />
        ))}

      {assembly && (
        <>
          <AssemblyForm open={editOpen} onClose={() => setEditOpen(false)} initial={assembly} />
          <ConfirmDialog
            open={toDelete}
            title="Delete assembly"
            message={`Delete "${assembly.name}"? This cannot be undone.`}
            onCancel={() => setToDelete(false)}
            onConfirm={() => deleteMut.mutate(assemblyId)}
            confirmLabel="Delete"
            destructive
            busy={deleteMut.isPending}
          />
        </>
      )}
    </Box>
  )
}
