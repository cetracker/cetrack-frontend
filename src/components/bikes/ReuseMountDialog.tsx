import { useState } from 'react'
import { Alert, Stack } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { mountComponent } from '@/api/bikes'
import { invalidateAfterMountingChanges } from '@/api/mountings'
import { withLocalOffset } from '@/utils/formatters'

interface ReuseMountDialogProps {
  open: boolean
  onClose: () => void
  bikeId: string
  mountPointId: string
  componentId: string
  componentName: string
  activeComponentName?: string
}

export const ReuseMountDialog = ({
  open,
  onClose,
  bikeId,
  mountPointId,
  componentId,
  componentName,
  activeComponentName,
}: ReuseMountDialogProps) => {
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [at, setAt] = useState<Date | null>(new Date())

  const mountMut = useApiMutation(
    (body: { componentId: string; at: string }) => mountComponent(bikeId, mountPointId, body),
    {
      onSuccess: async (changes) => {
        await invalidateAfterMountingChanges(qc)
        if (changes.closed?.length) {
          notify(
            `Mounted — auto-closed ${changes.closed.length} previous mounting${changes.closed.length > 1 ? 's' : ''}`,
            'success',
          )
        } else {
          notify('Component mounted', 'success')
        }
        onClose()
      },
    },
  )

  const submit = () => {
    if (!at) return
    mountMut.mutate({ componentId, at: withLocalOffset(at) })
  }

  return (
    <FormDialog
      open={open}
      title={`Re-mount ${componentName}`}
      onCancel={onClose}
      onSubmit={submit}
      submitting={mountMut.isPending}
      submitDisabled={!at}
      submitLabel="Mount"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {activeComponentName && (
          <Alert severity="warning">
            Mounting this component will dismount {activeComponentName}.
          </Alert>
        )}
        <DateTimePicker
          label="Mounted at"
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
