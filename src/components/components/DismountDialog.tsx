import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { dismountComponent } from '@/api/components'
import { invalidateAfterMountingChanges } from '@/api/mountings'
import { withLocalOffset } from '@/utils/formatters'

interface DismountDialogProps {
  open: boolean
  onClose: () => void
  componentId: string
}

export const DismountDialog = ({ open, onClose, componentId }: DismountDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [at, setAt] = useState<Date | null>(new Date())

  const dismountMut = useApiMutation(
    (body: { at: string }) => dismountComponent(componentId, body),
    {
      successMessage: t('components.dismount.successMessage'),
      onSuccess: async () => {
        await invalidateAfterMountingChanges(qc)
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
      title={t('components.dismount.title')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={dismountMut.isPending}
      submitDisabled={!at}
      submitLabel={t('components.detail.dismountButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <DateTimePicker
          label={t('components.dismount.atLabel')}
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
