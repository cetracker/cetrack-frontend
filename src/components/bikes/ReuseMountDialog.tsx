import { useState } from 'react'
import { Alert, Stack } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
            t('components.mount.autoClosedNotice', { count: changes.closed.length }),
            'success',
          )
        } else {
          notify(t('components.mount.successMessage'), 'success')
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
      title={t('bikes.reuseMount.title', { name: componentName })}
      onCancel={onClose}
      onSubmit={submit}
      submitting={mountMut.isPending}
      submitDisabled={!at}
      submitLabel={t('components.detail.mountButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {activeComponentName && (
          <Alert severity="warning">
            {t('bikes.reuseMount.dismountWarning', { name: activeComponentName })}
          </Alert>
        )}
        <DateTimePicker
          label={t('components.mount.atLabel')}
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true, autoFocus: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
