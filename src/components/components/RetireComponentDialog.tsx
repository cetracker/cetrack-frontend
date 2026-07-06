import { useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers'
import { MenuItem, Stack, TextField } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { componentQueryKey, componentsRootKey, retireComponent } from '@/api/components'
import type { RetirementKind } from '@/types/api'
import { withLocalOffset } from '@/utils/formatters'

interface RetireComponentDialogProps {
  open: boolean
  onClose: () => void
  componentId: string
}

export const RetireComponentDialog = ({
  open,
  onClose,
  componentId,
}: RetireComponentDialogProps) => {
  const qc = useQueryClient()
  const [at, setAt] = useState<Date | null>(new Date())
  const [kind, setKind] = useState<RetirementKind>('scrapped')

  const retireMut = useApiMutation(
    (body: { at: string; kind: RetirementKind }) => retireComponent(componentId, body),
    {
      successMessage: 'Component retired',
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: componentsRootKey })
        await qc.invalidateQueries({ queryKey: componentQueryKey(componentId) })
        onClose()
      },
    },
  )

  const submit = () => {
    if (!at) return
    retireMut.mutate({ at: withLocalOffset(at), kind })
  }

  return (
    <FormDialog
      open={open}
      title="Retire component"
      onCancel={onClose}
      onSubmit={submit}
      submitting={retireMut.isPending}
      submitDisabled={!at}
      submitLabel="Retire"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <DateTimePicker
          label="Retired at"
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
        <TextField
          select
          label="Reason"
          value={kind}
          onChange={(e) => setKind(e.target.value as RetirementKind)}
        >
          <MenuItem value="scrapped">Scrapped</MenuItem>
          <MenuItem value="sold">Sold</MenuItem>
        </TextField>
      </Stack>
    </FormDialog>
  )
}
