import { useEffect, useMemo } from 'react'
import { MenuItem, Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  componentQueryKey,
  componentsRootKey,
  createComponent,
  updateComponent,
} from '@/api/components'
import { componentTypesQuery } from '@/api/catalog'
import type { Component, ComponentInput } from '@/types/api'

const buildSchema = (t: TFunction) =>
  z.object({
    componentTypeId: z.string().min(1, t('validation.componentTypeRequired')),
    label: z.string().min(1, t('validation.labelRequired')),
    manufacturer: z.string(),
    model: z.string(),
    serialNumber: z.string(),
    vendor: z.string(),
    purchaseDate: z.date().nullable(),
    price: z
      .string()
      .regex(/^\d+(\.\d+)?$/, t('validation.priceFormat'))
      .or(z.literal('')),
    priceCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/, t('validation.currencyFormat'))
      .or(z.literal('')),
  })

type Values = z.infer<ReturnType<typeof buildSchema>>

const toISODate = (d: Date | null) => (d ? format(d, 'yyyy-MM-dd') : undefined)
const fromISODate = (s: string | null | undefined) => (s ? parseISO(s) : null)
const blankToUndef = (s: string) => (s.trim() ? s.trim() : undefined)

const emptyValues: Values = {
  componentTypeId: '',
  label: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  vendor: '',
  purchaseDate: null,
  price: '',
  priceCurrency: '',
}

interface ComponentFormProps {
  open: boolean
  onClose: () => void
  initial?: Component | null
}

export const ComponentForm = ({ open, onClose, initial }: ComponentFormProps) => {
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
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset({
        componentTypeId: initial?.componentTypeId ?? '',
        label: initial?.label ?? '',
        manufacturer: initial?.manufacturer ?? '',
        model: initial?.model ?? '',
        serialNumber: initial?.serialNumber ?? '',
        vendor: initial?.vendor ?? '',
        purchaseDate: fromISODate(initial?.purchaseDate),
        price: initial?.price ?? '',
        priceCurrency: initial?.priceCurrency ?? '',
      })
    }
  }, [open, initial, reset])

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: componentsRootKey })
    if (initial) await qc.invalidateQueries({ queryKey: componentQueryKey(initial.id) })
  }

  const createMut = useApiMutation(createComponent, {
    successMessage: t('components.form.createdSuccess'),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: ComponentInput }) => updateComponent(v.id, v.data),
    {
      successMessage: t('components.form.updatedSuccess'),
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: ComponentInput = {
      componentTypeId: values.componentTypeId,
      label: values.label.trim(),
      manufacturer: blankToUndef(values.manufacturer),
      model: blankToUndef(values.model),
      serialNumber: blankToUndef(values.serialNumber),
      vendor: blankToUndef(values.vendor),
      purchaseDate: toISODate(values.purchaseDate),
      price: blankToUndef(values.price),
      priceCurrency: blankToUndef(values.priceCurrency),
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
      title={initial ? t('components.form.editTitle') : t('components.form.addTitle')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={submitting}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Controller
          control={control}
          name="componentTypeId"
          render={({ field }) => (
            <TextField
              {...field}
              select
              label={t('components.fields.componentType')}
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
          name="label"
          render={({ field }) => (
            <TextField
              {...field}
              label={t('components.fields.label')}
              required
              error={!!errors.label}
              helperText={errors.label?.message}
              autoFocus
            />
          )}
        />
        <Controller
          control={control}
          name="manufacturer"
          render={({ field }) => <TextField {...field} label={t('components.fields.manufacturer')} />}
        />
        <Controller
          control={control}
          name="model"
          render={({ field }) => <TextField {...field} label={t('components.fields.model')} />}
        />
        <Controller
          control={control}
          name="serialNumber"
          render={({ field }) => <TextField {...field} label={t('components.fields.serialNumber')} />}
        />
        <Controller
          control={control}
          name="vendor"
          render={({ field }) => <TextField {...field} label={t('components.fields.vendor')} />}
        />
        <Stack direction="row" spacing={2}>
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <TextField
                {...field}
                label={t('components.fields.purchasePrice')}
                fullWidth
                error={!!errors.price}
                helperText={errors.price?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="priceCurrency"
            render={({ field }) => (
              <TextField
                {...field}
                label={t('components.fields.currency')}
                sx={{ width: 130 }}
                error={!!errors.priceCurrency}
                helperText={errors.priceCurrency?.message}
              />
            )}
          />
        </Stack>
        <Controller
          control={control}
          name="purchaseDate"
          render={({ field }) => (
            <DatePicker
              label={t('components.fields.purchaseDate')}
              displayWeekNumber
              value={field.value}
              onChange={field.onChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
