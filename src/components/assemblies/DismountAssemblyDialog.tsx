import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
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
  const qc = useQueryClient()
  const [at, setAt] = useState<Date | null>(new Date())

  const dismountMut = useApiMutation(
    (body: { at: string }) => dismountAssembly(assemblyId, body),
    {
      successMessage: 'Assembly dismounted',
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
      title="Dismount assembly"
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
