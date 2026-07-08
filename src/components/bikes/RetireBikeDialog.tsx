import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { bikeQueryKey, bikesQueryKey, retireBike } from '@/api/bikes'
import { withLocalOffset } from '@/utils/formatters'

interface RetireBikeDialogProps {
  open: boolean
  onClose: () => void
  bikeId: string
}

export const RetireBikeDialog = ({ open, onClose, bikeId }: RetireBikeDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [at, setAt] = useState<Date | null>(new Date())

  const retireMut = useApiMutation(
    (body: { at: string }) => retireBike(bikeId, body),
    {
      successMessage: t('bikes.retire.successMessage'),
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: bikesQueryKey })
        await qc.invalidateQueries({ queryKey: bikeQueryKey(bikeId) })
        onClose()
      },
    },
  )

  const submit = () => {
    if (!at) return
    retireMut.mutate({ at: withLocalOffset(at) })
  }

  return (
    <FormDialog
      open={open}
      title={t('bikes.retire.title')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={retireMut.isPending}
      submitDisabled={!at}
      submitLabel={t('bikes.detail.retireButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <DateTimePicker
          label={t('bikes.retire.atLabel')}
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
