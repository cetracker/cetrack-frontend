import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { dismountAssembly, invalidateAfterAssemblyMountingChanges } from '@/api/assemblies'
import { withLocalOffset } from '@/utils/formatters'

interface DismountAssemblyDialogProps {
  open: boolean
  onClose: () => void
  assemblyId: string
}

export const DismountAssemblyDialog = ({
  open,
  onClose,
  assemblyId,
}: DismountAssemblyDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [at, setAt] = useState<Date | null>(new Date())

  const dismountMut = useApiMutation(
    (body: { at: string }) => dismountAssembly(assemblyId, body),
    {
      successMessage: t('assemblies.dismount.successMessage'),
      onSuccess: async () => {
        await invalidateAfterAssemblyMountingChanges(qc, assemblyId)
        onClose()
      },
    },
  )

  const submit = () => {
    if (!at) return
    dismountMut.mutate({ at: withLocalOffset(at) })
  }

  return (
    <FormDialog
      open={open}
      title={t('assemblies.dismount.title')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={dismountMut.isPending}
      submitDisabled={!at}
      submitLabel={t('components.detail.dismountButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <DateTimePicker
          label={t('assemblies.dismount.atLabel')}
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
