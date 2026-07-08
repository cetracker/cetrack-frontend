import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { removeAssemblyMember, invalidateAfterAssemblyMountingChanges } from '@/api/assemblies'
import { withLocalOffset } from '@/utils/formatters'

interface RemoveMemberDialogProps {
  open: boolean
  onClose: () => void
  assemblyId: string
  componentId: string
}

export const RemoveMemberDialog = ({
  open,
  onClose,
  assemblyId,
  componentId,
}: RemoveMemberDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [at, setAt] = useState<Date | null>(new Date())

  const removeMemberMut = useApiMutation(
    (body: { to: string }) => removeAssemblyMember(assemblyId, { componentId, to: body.to }),
    {
      onSuccess: async (changes) => {
        await invalidateAfterAssemblyMountingChanges(qc, assemblyId)
        notify(
          changes.closed?.length
            ? t('assemblies.removeMember.removedWithClosed', { count: changes.closed.length })
            : t('assemblies.removeMember.removedSuccess'),
          'success',
        )
        onClose()
      },
    },
  )

  const submit = () => {
    if (!at) return
    removeMemberMut.mutate({ to: withLocalOffset(at) })
  }

  return (
    <FormDialog
      open={open}
      title={t('assemblies.removeMember.title')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={removeMemberMut.isPending}
      submitDisabled={!at}
      submitLabel={t('assemblies.removeMember.removeButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <DateTimePicker
          label={t('assemblies.removeMember.atLabel')}
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
