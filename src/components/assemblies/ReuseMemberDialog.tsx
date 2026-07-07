import { useState } from 'react'
import { Alert, MenuItem, Stack, TextField } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { addAssemblyMember, assemblyMountingsQuery, invalidateAfterAssemblyMountingChanges } from '@/api/assemblies'
import { bikesQuery } from '@/api/bikes'
import { isApiError } from '@/api/client'
import { friendlyErrorMessage } from '@/utils/errors'
import type { Candidate, MountingChanges } from '@/types/api'
import { bikeIdentity, withLocalOffset } from '@/utils/formatters'

interface ReuseMemberDialogProps {
  open: boolean
  onClose: () => void
  assemblyId: string
  slotId: string
  componentId: string
  componentName: string
  activeComponentName?: string
  assemblyMounted: boolean
}

const tailoredErrorMessage = (
  code: string,
  componentName: string,
  activeComponentName: string | undefined,
  bikeName: string,
): string | null => {
  const occupant = activeComponentName ?? 'The current member'
  if (code === 'MOUNTING_GOVERNED') {
    return `Couldn't swap in ${componentName}: this slot's mount point on ${bikeName} is held by another assembly. ${occupant} is unchanged.`
  }
  if (code === 'SLOT_UNMOUNTABLE') {
    return `Couldn't swap in ${componentName}: it can't be mounted at this slot's resolved mount point on ${bikeName}. ${occupant} is unchanged.`
  }
  return null
}

const changeSummary = (changes: MountingChanges): string => {
  const parts: string[] = []
  if (changes.membershipChanges?.some((c) => c.action === 'removed')) {
    parts.push("ended the previous member's membership")
  }
  if (changes.created?.length) {
    parts.push(`mounted onto ${changes.created.length} mount point${changes.created.length > 1 ? 's' : ''}`)
  }
  return parts.length ? ` — ${parts.join(', ')}` : ''
}

export const ReuseMemberDialog = ({
  open,
  onClose,
  assemblyId,
  slotId,
  componentId,
  componentName,
  activeComponentName,
  assemblyMounted,
}: ReuseMemberDialogProps) => {
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [at, setAt] = useState<Date | null>(new Date())
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [mountPointId, setMountPointId] = useState<string | null>(null)
  const [tailoredError, setTailoredError] = useState<string | null>(null)

  const { data: assemblyMountings } = useQuery({
    ...assemblyMountingsQuery(assemblyId),
    enabled: assemblyMounted && open,
  })
  const { data: bikes } = useQuery({ ...bikesQuery(), enabled: assemblyMounted && open })
  const activeAssemblyMounting = (assemblyMountings ?? []).find((m) => !m.dismountedAt)
  const bikeName = activeAssemblyMounting
    ? bikeIdentity((bikes ?? []).find((b) => b.id === activeAssemblyMounting.bikeId))
    : ''

  const resetLocal = () => {
    setAt(new Date())
    setCandidates(null)
    setMountPointId(null)
    setTailoredError(null)
  }

  const handleClose = () => {
    resetLocal()
    onClose()
  }

  const reuseMut = useApiMutation(
    (body: { at: Date; mountPointId?: string }) =>
      addAssemblyMember(assemblyId, {
        componentId,
        slotId,
        from: withLocalOffset(body.at),
        mountPointId: body.mountPointId,
      }),
    {
      notifyOnError: false,
      onSuccess: async (changes) => {
        await invalidateAfterAssemblyMountingChanges(qc, assemblyId)
        notify(`${componentName} re-used${changeSummary(changes)}`, 'success')
        handleClose()
      },
      onError: (err) => {
        if (isApiError(err) && err.code === 'UNRESOLVED_SLOTS') {
          const details = err.details?.candidates as Candidate[] | undefined
          if (details) {
            setCandidates(details)
            return
          }
        }
        if (isApiError(err) && err.code && (err.code === 'MOUNTING_GOVERNED' || err.code === 'SLOT_UNMOUNTABLE')) {
          setTailoredError(tailoredErrorMessage(err.code, componentName, activeComponentName, bikeName))
          return
        }
        notify(friendlyErrorMessage(err), 'error')
      },
    },
  )

  const submit = () => {
    setTailoredError(null)
    if (candidates) {
      if (!mountPointId || !at) return
      reuseMut.mutate({ at, mountPointId })
      return
    }
    if (!at) return
    reuseMut.mutate({ at })
  }

  const submitDisabled = candidates ? !mountPointId : !at

  return (
    <FormDialog
      open={open}
      title={`Re-use ${componentName}`}
      onCancel={handleClose}
      onSubmit={submit}
      submitting={reuseMut.isPending}
      submitDisabled={submitDisabled}
      submitLabel={candidates ? 'Resolve & Re-use' : 'Re-use'}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {activeComponentName && (
          <Alert severity="warning">
            Adding {componentName} will end {activeComponentName}&apos;s membership
            {assemblyMounted && ' and dismount it'}.
          </Alert>
        )}
        {tailoredError && <Alert severity="error">{tailoredError}</Alert>}
        {!candidates && (
          <DateTimePicker
            label="From"
            value={at}
            onChange={setAt}
            slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
          />
        )}
        {candidates && (
          <TextField
            select
            label="Mount point"
            required
            value={mountPointId ?? ''}
            onChange={(e) => setMountPointId(e.target.value)}
            helperText="This assembly is mounted — pick where this member goes."
          >
            {candidates.map((c) => (
              <MenuItem key={c.mountPointId} value={c.mountPointId}>
                {c.mountPointName}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>
    </FormDialog>
  )
}
