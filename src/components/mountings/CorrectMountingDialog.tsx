import { useEffect } from 'react'
import { Checkbox, FormControlLabel, Stack } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { correctMounting, invalidateAfterMountingChanges } from '@/api/mountings'
import type { Mounting } from '@/types/api'
import { withLocalOffset } from '@/utils/formatters'
import { buildCorrectMountingBody } from '@/utils/components'

interface Values {
  mountedAt: Date | null
  dismountedAt: Date | null
  reopen: boolean
}

interface CorrectMountingDialogProps {
  open: boolean
  onClose: () => void
  mounting: Mounting | null
}

export const CorrectMountingDialog = ({ open, onClose, mounting }: CorrectMountingDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { dirtyFields },
  } = useForm<Values>({
    defaultValues: { mountedAt: null, dismountedAt: null, reopen: false },
  })

  useEffect(() => {
    if (open && mounting) {
      reset({
        mountedAt: new Date(mounting.mountedAt),
        dismountedAt: mounting.dismountedAt ? new Date(mounting.dismountedAt) : null,
        reopen: false,
      })
    }
  }, [open, mounting, reset])

  const reopen = watch('reopen')

  const correctMut = useApiMutation(
    (body: ReturnType<typeof buildCorrectMountingBody>) =>
      correctMounting(mounting!.id, body),
    {
      successMessage: t('mountings.correct.successMessage'),
      onSuccess: async () => {
        await invalidateAfterMountingChanges(qc)
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const body = buildCorrectMountingBody({
      mountedAt: dirtyFields.mountedAt && values.mountedAt ? withLocalOffset(values.mountedAt) : undefined,
      dismountedAt:
        !values.reopen && dirtyFields.dismountedAt && values.dismountedAt
          ? withLocalOffset(values.dismountedAt)
          : undefined,
      reopen: values.reopen,
    })
    correctMut.mutate(body)
  })

  return (
    <FormDialog
      open={open}
      title={t('mountings.correct.title')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={correctMut.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Controller
          control={control}
          name="mountedAt"
          render={({ field }) => (
            <DateTimePicker
              label={t('components.mount.atLabel')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          )}
        />
        <Controller
          control={control}
          name="dismountedAt"
          render={({ field }) => (
            <DateTimePicker
              label={t('components.dismount.atLabel')}
              value={field.value}
              onChange={field.onChange}
              disabled={reopen}
              slotProps={{ textField: { fullWidth: true } }}
            />
          )}
        />
        {mounting?.dismountedAt && (
          <Controller
            control={control}
            name="reopen"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={t('mountings.correct.reopenLabel')}
              />
            )}
          />
        )}
      </Stack>
    </FormDialog>
  )
}
