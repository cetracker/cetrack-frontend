import { useEffect } from 'react'
import { Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { createBike, updateBike, bikesQueryKey } from '@/api/bikes'
import type { Bike, BikeInput } from '@/types/api'
import { useQueryClient } from '@tanstack/react-query'

const schema = z
  .object({
    name: z.string(),
    manufacturer: z.string(),
    model: z.string(),
    purchaseDate: z.date().nullable(),
    price: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'Use a decimal like 10.57')
      .or(z.literal('')),
    priceCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/, 'ISO 4217 code, e.g. EUR')
      .or(z.literal('')),
  })
  .refine((v) => v.name.trim() || v.model.trim(), {
    message: 'Name or model required',
    path: ['name'],
  })

export type BikeFormValues = z.infer<typeof schema>

const toISODate = (d: Date | null) => (d ? format(d, 'yyyy-MM-dd') : undefined)
const fromISODate = (s: string | null | undefined) => (s ? parseISO(s) : null)
const blankToUndef = (s: string) => (s.trim() ? s.trim() : undefined)

interface BikeFormProps {
  open: boolean
  onClose: () => void
  initial?: Bike | null
}

export const BikeForm = ({ open, onClose, initial }: BikeFormProps) => {
  const qc = useQueryClient()

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
    successMessage: 'Bike created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; bike: BikeInput }) => updateBike(v.id, v.bike),
    {
      successMessage: 'Bike updated',
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
      title={initial ? 'Edit Bike' : 'Add Bike'}
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
              label="Name"
              error={!!errors.name}
              helperText={errors.name?.message ?? 'Name or model required'}
              autoFocus
            />
          )}
        />
        <Controller
          control={control}
          name="manufacturer"
          render={({ field }) => <TextField {...field} label="Manufacturer" />}
        />
        <Controller
          control={control}
          name="model"
          render={({ field }) => <TextField {...field} label="Model" />}
        />
        <Controller
          control={control}
          name="purchaseDate"
          render={({ field }) => (
            <DatePicker
              label="Purchase Date"
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
                label="Purchase Price"
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
                label="Currency"
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
