import { useEffect, useMemo } from 'react'
import { MenuItem, Stack, TextField } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createAssemblySlot,
  updateAssemblySlot,
  assemblyQueryKey,
} from '@/api/assemblies'
import { componentTypesQuery } from '@/api/catalog'
import { withLocalOffset } from '@/utils/formatters'
import type { AssemblySlot, AssemblySlotInput } from '@/types/api'

const buildSchema = (t: TFunction) =>
  z
    .object({
      name: z.string().min(1, t('validation.nameRequired')),
      componentTypeId: z.string().min(1, t('validation.componentTypeRequired')),
      validFrom: z.date({ message: t('assemblies.slot.validFromRequired') }),
      validTo: z.date().nullable(),
    })
    .refine((v) => !v.validTo || v.validTo > v.validFrom, {
      message: t('assemblies.slot.validToAfterFrom'),
      path: ['validTo'],
    })

type Values = z.infer<ReturnType<typeof buildSchema>>

interface AssemblySlotFormProps {
  open: boolean
  onClose: () => void
  assemblyId: string
  initial?: AssemblySlot | null
}

export const AssemblySlotForm = ({
  open,
  onClose,
  assemblyId,
  initial,
}: AssemblySlotFormProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const schema = useMemo(() => buildSchema(t), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      componentTypeId: '',
      validFrom: new Date(),
      validTo: null,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        componentTypeId: initial?.componentTypeId ?? '',
        validFrom: initial?.validFrom ? new Date(initial.validFrom) : new Date(),
        validTo: initial?.validTo ? new Date(initial.validTo) : null,
      })
    }
  }, [open, initial, reset])

  const invalidate = async () =>
    qc.invalidateQueries({ queryKey: assemblyQueryKey(assemblyId) })

  const createMut = useApiMutation(
    (data: AssemblySlotInput) => createAssemblySlot(assemblyId, data),
    {
      successMessage: t('assemblies.slot.createdSuccess'),
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const updateMut = useApiMutation(
    (v: { id: string; data: AssemblySlotInput }) =>
      updateAssemblySlot(assemblyId, v.id, v.data),
    {
      successMessage: t('assemblies.slot.updatedSuccess'),
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: AssemblySlotInput = {
      name: values.name.trim(),
      componentTypeId: values.componentTypeId,
      validFrom: withLocalOffset(values.validFrom),
      ...(values.validTo ? { validTo: withLocalOffset(values.validTo) } : {}),
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
      title={initial ? t('assemblies.slot.editTitle') : t('assemblies.slot.addTitle')}
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
          name="componentTypeId"
          render={({ field }) => (
            <TextField
              {...field}
              select
              label={t('common.componentType')}
              required
              error={!!errors.componentTypeId}
              helperText={errors.componentTypeId?.message}
            >
              {(componentTypes ?? []).map((ct) => (
                <MenuItem key={ct.id} value={ct.id}>
                  {ct.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          control={control}
          name="validFrom"
          render={({ field }) => (
            <DateTimePicker
              label={t('assemblies.slot.validFromLabel')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.validFrom,
                  helperText: errors.validFrom?.message,
                },
              }}
            />
          )}
        />
        <Controller
          control={control}
          name="validTo"
          render={({ field }) => (
            <DateTimePicker
              label={t('assemblies.slot.validToLabel')}
              value={field.value}
              onChange={field.onChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.validTo,
                  helperText: errors.validTo?.message,
                },
              }}
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
