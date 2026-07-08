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
  componentTypeQueryKey,
  componentTypesQueryKey,
  createComponentType,
  updateComponentType,
} from '@/api/catalog'
import type { ComponentType, ComponentTypeInput } from '@/types/api'

const buildSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    description: z.string(),
  })

type Values = z.infer<ReturnType<typeof buildSchema>>

interface ComponentTypeFormProps {
  open: boolean
  onClose: () => void
  initial?: ComponentType | null
}

export const ComponentTypeForm = ({ open, onClose, initial }: ComponentTypeFormProps) => {
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
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
      })
    }
  }, [open, initial, reset])

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: componentTypesQueryKey })
    if (initial) await qc.invalidateQueries({ queryKey: componentTypeQueryKey(initial.id) })
  }

  const createMut = useApiMutation(createComponentType, {
    successMessage: t('catalog.componentTypeList.createdSuccess'),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: ComponentTypeInput }) =>
      updateComponentType(v.id, v.data),
    {
      successMessage: t('catalog.componentTypeList.updatedSuccess'),
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: ComponentTypeInput = {
      name: values.name,
      description: values.description.trim() || undefined,
    }
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
      title={initial ? t('catalog.componentTypeForm.editTitle') : t('catalog.componentTypeForm.addTitle')}
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
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextField {...field} label={t('common.description')} multiline minRows={2} />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
