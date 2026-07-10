import { useEffect } from 'react'
import { Checkbox, FormControlLabel, Stack } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { correctMembership, invalidateAfterMembershipChanges } from '@/api/memberships'
import type { AssemblyMembership } from '@/types/api'
import { withLocalOffset } from '@/utils/formatters'
import { buildCorrectMembershipBody } from '@/utils/components'

interface Values {
  memberFrom: Date | null
  memberTo: Date | null
  reopen: boolean
}

interface CorrectMembershipDialogProps {
  open: boolean
  onClose: () => void
  membership: AssemblyMembership | null
}

export const CorrectMembershipDialog = ({ open, onClose, membership }: CorrectMembershipDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { dirtyFields },
  } = useForm<Values>({
    defaultValues: { memberFrom: null, memberTo: null, reopen: false },
  })

  useEffect(() => {
    if (open && membership) {
      reset({
        memberFrom: new Date(membership.memberFrom),
        memberTo: membership.memberTo ? new Date(membership.memberTo) : null,
        reopen: false,
      })
    }
  }, [open, membership, reset])

  const reopen = watch('reopen')

  const correctMut = useApiMutation(
    (body: ReturnType<typeof buildCorrectMembershipBody>) =>
      correctMembership(membership!.id, body),
    {
      successMessage: t('assemblies.membershipHistory.correct.successMessage'),
      onSuccess: async () => {
        await invalidateAfterMembershipChanges(qc)
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const body = buildCorrectMembershipBody({
      memberFrom: dirtyFields.memberFrom && values.memberFrom ? withLocalOffset(values.memberFrom) : undefined,
      memberTo:
        !values.reopen && dirtyFields.memberTo && values.memberTo
          ? withLocalOffset(values.memberTo)
          : undefined,
      reopen: values.reopen,
    })
    correctMut.mutate(body)
  })

  return (
    <FormDialog
      open={open}
      title={t('assemblies.membershipHistory.correct.title')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={correctMut.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Controller
          control={control}
          name="memberFrom"
          render={({ field }) => (
            <DateTimePicker
              label={t('assemblies.membershipHistory.fromHeader')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          )}
        />
        <Controller
          control={control}
          name="memberTo"
          render={({ field }) => (
            <DateTimePicker
              label={t('assemblies.membershipHistory.toHeader')}
              value={field.value}
              onChange={field.onChange}
              disabled={reopen}
              slotProps={{ textField: { fullWidth: true } }}
            />
          )}
        />
        {membership?.memberTo && (
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
                label={t('assemblies.membershipHistory.correct.reopenLabel')}
              />
            )}
          />
        )}
      </Stack>
    </FormDialog>
  )
}
