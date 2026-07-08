import { useEffect, useMemo } from 'react'
import { Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createPosition,
  positionQueryKey,
  positionsQueryKey,
  updatePosition,
} from '@/api/catalog'
import type { Position, PositionInput } from '@/types/api'

const buildSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')),
  })

type Values = z.infer<ReturnType<typeof buildSchema>>

interface PositionFormProps {
  open: boolean
  onClose: () => void
  initial?: Position | null
}

export const PositionForm = ({ open, onClose, initial }: PositionFormProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const schema = useMemo(() => buildSchema(t), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ name: initial?.name ?? '' })
    }
  }, [open, initial, reset])

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: positionsQueryKey })
    if (initial) await qc.invalidateQueries({ queryKey: positionQueryKey(initial.id) })
  }

  const createMut = useApiMutation(createPosition, {
    successMessage: t('catalog.positionList.createdSuccess'),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: PositionInput }) => updatePosition(v.id, v.data),
    {
      successMessage: t('catalog.positionList.updatedSuccess'),
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: PositionInput = { name: values.name }
    if (initial) {
      updateMut.mutate({ id: initial.id, data: payload })
    } else {
      createMut.mutate(payload)
    }
  })

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <FormDialog
      open={open}
      title={initial ? t('catalog.positionForm.editTitle') : t('catalog.positionForm.addTitle')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={submitting}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              {...field}
              label={t('common.name')}
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              autoFocus
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
