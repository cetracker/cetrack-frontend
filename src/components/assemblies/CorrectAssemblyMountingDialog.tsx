import { useEffect } from 'react'
import { Checkbox, FormControlLabel, Stack } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { correctAssemblyMounting, invalidateAfterAssemblyMountingChanges } from '@/api/assemblies'
import type { AssemblyMounting } from '@/types/api'
import { withLocalOffset } from '@/utils/formatters'
import { buildCorrectAssemblyMountingBody } from '@/utils/components'

interface Values {
  mountedAt: Date | null
  dismountedAt: Date | null
  reopen: boolean
}

interface CorrectAssemblyMountingDialogProps {
  open: boolean
  onClose: () => void
  assemblyId: string
  mounting: AssemblyMounting | null
}

export const CorrectAssemblyMountingDialog = ({
  open,
  onClose,
  assemblyId,
  mounting,
}: CorrectAssemblyMountingDialogProps) => {
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
    (body: ReturnType<typeof buildCorrectAssemblyMountingBody>) =>
      correctAssemblyMounting(assemblyId, mounting!.id, body),
    {
      successMessage: t('assemblies.mountingHistory.correct.successMessage'),
      onSuccess: async () => {
        await invalidateAfterAssemblyMountingChanges(qc, assemblyId)
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const body = buildCorrectAssemblyMountingBody({
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
      title={t('assemblies.mountingHistory.correct.title')}
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
                label={t('assemblies.mountingHistory.correct.reopenLabel')}
              />
            )}
          />
        )}
      </Stack>
    </FormDialog>
  )
}
