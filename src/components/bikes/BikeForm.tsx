import { useEffect, useMemo } from 'react'
import { Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { createBike, updateBike, bikesQueryKey } from '@/api/bikes'
import type { Bike, BikeInput } from '@/types/api'
import { useQueryClient } from '@tanstack/react-query'

const buildSchema = (t: TFunction) =>
  z
    .object({
      name: z.string(),
      manufacturer: z.string(),
      model: z.string(),
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
    .refine((v) => v.name.trim() || v.model.trim(), {
      message: t('bikes.form.nameOrModelRequired'),
      path: ['name'],
    })

export type BikeFormValues = z.infer<ReturnType<typeof buildSchema>>

const toISODate = (d: Date | null) => (d ? format(d, 'yyyy-MM-dd') : undefined)
const fromISODate = (s: string | null | undefined) => (s ? parseISO(s) : null)
const blankToUndef = (s: string) => (s.trim() ? s.trim() : undefined)

interface BikeFormProps {
  open: boolean
  onClose: () => void
  initial?: Bike | null
}

export const BikeForm = ({ open, onClose, initial }: BikeFormProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const schema = useMemo(() => buildSchema(t), [t])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BikeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      manufacturer: '',
      model: '',
      purchaseDate: null,
      price: '',
      priceCurrency: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        manufacturer: initial?.manufacturer ?? '',
        model: initial?.model ?? '',
        purchaseDate: fromISODate(initial?.purchaseDate),
        price: initial?.price ?? '',
        priceCurrency: initial?.priceCurrency ?? '',
      })
    }
  }, [open, initial, reset])

  const invalidate = async () => qc.invalidateQueries({ queryKey: bikesQueryKey })

  const createMut = useApiMutation(createBike, {
    successMessage: t('bikes.form.createdSuccess'),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; bike: BikeInput }) => updateBike(v.id, v.bike),
    {
      successMessage: t('bikes.form.updatedSuccess'),
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: BikeInput = {
      name: values.name.trim() || undefined,
      manufacturer: values.manufacturer.trim() || undefined,
      model: values.model.trim() || undefined,
      purchaseDate: toISODate(values.purchaseDate),
      price: blankToUndef(values.price),
      priceCurrency: blankToUndef(values.priceCurrency),
    }
    if (initial) {
      updateMut.mutate({ id: initial.id, bike: payload })
    } else {
      createMut.mutate(payload)
    }
  })

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <FormDialog
      open={open}
      title={initial ? t('bikes.form.editTitle') : t('bikes.form.addTitle')}
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
              error={!!errors.name}
              helperText={errors.name?.message ?? t('bikes.form.nameOrModelRequired')}
              autoFocus
            />
          )}
        />
        <Controller
          control={control}
          name="manufacturer"
          render={({ field }) => <TextField {...field} label={t('common.manufacturer')} />}
        />
        <Controller
          control={control}
          name="model"
          render={({ field }) => <TextField {...field} label={t('common.model')} />}
        />
        <Controller
          control={control}
          name="purchaseDate"
          render={({ field }) => (
            <DatePicker
              label={t('common.purchaseDate')}
              displayWeekNumber
              value={field.value}
              onChange={field.onChange}
              slotProps={{ textField: { fullWidth: true } }}
            />
          )}
        />
        <Stack direction="row" spacing={2}>
          <Controller
            control={control}
            name="price"
            render={({ field }) => (
              <TextField
                {...field}
                label={t('common.purchasePrice')}
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
                label={t('common.currency')}
                sx={{ width: 130 }}
                error={!!errors.priceCurrency}
                helperText={errors.priceCurrency?.message}
              />
            )}
          />
        </Stack>
      </Stack>
    </FormDialog>
  )
}
