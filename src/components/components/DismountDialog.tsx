import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
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
  const qc = useQueryClient()
  const [at, setAt] = useState<Date | null>(new Date())

  const dismountMut = useApiMutation(
    (body: { at: string }) => dismountComponent(componentId, body),
    {
      successMessage: 'Component dismounted',
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
      title="Dismount component"
      onCancel={onClose}
      onSubmit={submit}
      submitting={dismountMut.isPending}
      submitDisabled={!at}
      submitLabel="Dismount"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <DateTimePicker
          label="Dismounted at"
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
