import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { createMaintenanceEvent, invalidateMaintenance } from '@/api/maintenance'
import { withLocalOffset } from '@/utils/formatters'

interface LogEventDialogProps {
  open: boolean
  onClose: () => void
  taskId: string
}

export const LogEventDialog = ({ open, onClose, taskId }: LogEventDialogProps) => {
  const qc = useQueryClient()
  const [at, setAt] = useState<Date | null>(new Date())

  const logMut = useApiMutation(
    (body: { performedAt: string }) => createMaintenanceEvent(taskId, body),
    {
      successMessage: 'Event logged',
      onSuccess: async () => {
        await invalidateMaintenance(qc)
        onClose()
      },
    },
  )

  const submit = () => {
    if (!at) return
    logMut.mutate({ performedAt: withLocalOffset(at) })
  }

  return (
    <FormDialog
      open={open}
      title="Log maintenance event"
      onCancel={onClose}
      onSubmit={submit}
      submitting={logMut.isPending}
      submitDisabled={!at}
      submitLabel="Log"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <DateTimePicker
          label="Performed at"
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
