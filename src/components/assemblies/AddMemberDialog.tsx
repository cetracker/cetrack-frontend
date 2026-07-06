import { useState } from 'react'
import { Autocomplete, MenuItem, Stack, TextField } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { addAssemblyMember, invalidateAfterAssemblyMountingChanges } from '@/api/assemblies'
import { componentsQuery } from '@/api/components'
import { isApiError } from '@/api/client'
import { friendlyErrorMessage } from '@/utils/errors'
import type { Assembly, AssemblySlot, Candidate, Component } from '@/types/api'
import { componentDisambiguator, componentIdentity, withLocalOffset } from '@/utils/formatters'

interface AddMemberDialogProps {
  open: boolean
  onClose: () => void
  assemblyId: string
  assembly: Assembly
  slot: AssemblySlot | null
}

export const AddMemberDialog = ({
  open,
  onClose,
  assemblyId,
  assembly,
  slot,
}: AddMemberDialogProps) => {
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [componentId, setComponentId] = useState<string | null>(null)
  const [at, setAt] = useState<Date | null>(new Date())
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [mountPointId, setMountPointId] = useState<string | null>(null)

  const { data: components } = useQuery({
    ...componentsQuery(
      slot ? { componentTypeId: slot.componentTypeId, status: 'inStock' } : {},
    ),
    enabled: !!slot && open,
  })

  const resetLocal = () => {
    setComponentId(null)
    setAt(new Date())
    setCandidates(null)
    setMountPointId(null)
  }

  const handleClose = () => {
    resetLocal()
    onClose()
  }

  const addMemberMut = useApiMutation(
    (body: { componentId: string; at: Date; mountPointId?: string }) =>
      addAssemblyMember(assemblyId, {
        componentId: body.componentId,
        slotId: slot!.id,
        from: withLocalOffset(body.at),
        mountPointId: body.mountPointId,
      }),
    {
      notifyOnError: false,
      onSuccess: async (changes) => {
        await invalidateAfterAssemblyMountingChanges(qc, assemblyId)
        notify(
          changes.created?.length
            ? `Member added — mounted onto ${changes.created.length} mount point${changes.created.length > 1 ? 's' : ''}`
            : 'Member added',
          'success',
        )
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
        notify(friendlyErrorMessage(err), 'error')
      },
    },
  )

  const submit = () => {
    if (candidates) {
      if (!componentId || !at || !mountPointId) return
      addMemberMut.mutate({ componentId, at, mountPointId })
      return
    }
    if (!componentId || !at) return
    addMemberMut.mutate({ componentId, at })
  }

  const submitDisabled = candidates ? !mountPointId : !componentId || !at

  return (
    <FormDialog
      open={open}
      title={slot ? `Add member to ${slot.name}` : 'Add member'}
      onCancel={handleClose}
      onSubmit={submit}
      submitting={addMemberMut.isPending}
      submitDisabled={submitDisabled}
      submitLabel={candidates ? 'Resolve & Add' : 'Add'}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {!candidates && (
          <>
            <Autocomplete<Component>
              options={components ?? []}
              value={(components ?? []).find((c) => c.id === componentId) ?? null}
              onChange={(_, option) => setComponentId(option?.id ?? null)}
              getOptionLabel={(c) => componentIdentity(c)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderOption={({ key: _key, ...props }, c) => (
                <li key={c.id} {...props}>
                  <Stack>
                    <span>{componentIdentity(c)}</span>
                    {componentDisambiguator(c) && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--mui-palette-text-secondary)' }}>
                        {componentDisambiguator(c)}
                      </span>
                    )}
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Component" required autoFocus />
              )}
            />
            <DateTimePicker
              label="From"
              value={at}
              onChange={setAt}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </>
        )}
        {candidates && (
          <TextField
            select
            label="Mount point"
            required
            value={mountPointId ?? ''}
            onChange={(e) => setMountPointId(e.target.value)}
            helperText={`This assembly (${assembly.name}) is mounted — pick where this member goes.`}
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
