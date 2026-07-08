import { useState } from 'react'
import { Autocomplete, Chip, MenuItem, Stack, TextField } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { addAssemblyMember, invalidateAfterAssemblyMountingChanges } from '@/api/assemblies'
import { componentsQuery } from '@/api/components'
import { isApiError } from '@/api/client'
import { friendlyErrorMessage } from '@/utils/errors'
import type { Assembly, AssemblySlot, Candidate, Component } from '@/types/api'
import { componentDisambiguator, componentIdentity, withLocalOffset } from '@/utils/formatters'
import { isComponentRetired } from '@/utils/components'

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
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [componentId, setComponentId] = useState<string | null>(null)
  const [at, setAt] = useState<Date | null>(new Date())
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const [mountPointId, setMountPointId] = useState<string | null>(null)

  const { data: components } = useQuery({
    ...componentsQuery(slot ? { componentTypeId: slot.componentTypeId } : {}),
    enabled: !!slot && open,
  })

  const options = (components ?? []).filter((c) => !isComponentRetired(c))

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
            ? t('assemblies.addMember.addedWithMounted', { count: changes.created.length })
            : t('assemblies.addMember.addedSuccess'),
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
      title={slot ? t('assemblies.addMember.dialogTitleWithSlot', { slotName: slot.name }) : t('assemblies.addMember.dialogTitleFallback')}
      onCancel={handleClose}
      onSubmit={submit}
      submitting={addMemberMut.isPending}
      submitDisabled={submitDisabled}
      submitLabel={candidates ? t('assemblies.addMember.resolveAddButton') : t('assemblies.addMember.addButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {!candidates && (
          <>
            <Autocomplete<Component>
              options={options}
              value={options.find((c) => c.id === componentId) ?? null}
              onChange={(_, option) => setComponentId(option?.id ?? null)}
              getOptionLabel={(c) => componentIdentity(c)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderOption={({ key: _key, ...props }, c) => (
                <li key={c.id} {...props}>
                  <Stack direction="row" spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
                    <Stack sx={{ flexGrow: 1 }}>
                      <span>{componentIdentity(c)}</span>
                      {componentDisambiguator(c) && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--mui-palette-text-secondary)' }}>
                          {componentDisambiguator(c)}
                        </span>
                      )}
                    </Stack>
                    {c.directlyMounted && <Chip label={t('status.mounted')} size="small" />}
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label={t('components.list.columns.component')} required autoFocus />
              )}
            />
            <DateTimePicker
              label={t('assemblies.addMember.fromLabel')}
              value={at}
              onChange={setAt}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </>
        )}
        {candidates && (
          <TextField
            select
            label={t('components.mount.mountPointLabel')}
            required
            value={mountPointId ?? ''}
            onChange={(e) => setMountPointId(e.target.value)}
            helperText={t('assemblies.addMember.mountPointHelper', { name: assembly.name })}
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
