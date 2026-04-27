import { useEffect } from 'react'
import { Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { createBike, updateBike, bikesQueryKey } from '@/api/bikes'
import type { Bike } from '@/types/api'
import { useQueryClient } from '@tanstack/react-query'

const schema = z.object({
  manufacturer: z.string().min(1, 'Manufacturer required'),
  model: z.string().min(1, 'Model required'),
  boughtAt: z.date().nullable(),
  retiredAt: z.date().nullable(),
})

export type BikeFormValues = z.infer<typeof schema>

const toISO = (d: Date | null) => (d ? d.toISOString() : null)
const fromISO = (s: string | null | undefined) => (s ? new Date(s) : null)

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
      manufacturer: '',
      model: '',
      boughtAt: null,
      retiredAt: null,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        manufacturer: initial?.manufacturer ?? '',
        model: initial?.model ?? '',
        boughtAt: fromISO(initial?.boughtAt),
        retiredAt: fromISO(initial?.retiredAt),
      })
    }
  }, [open, initial, reset])

  const invalidate = () => qc.invalidateQueries({ queryKey: bikesQueryKey })

  const createMut = useApiMutation(createBike, {
    successMessage: 'Bike created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; bike: Bike }) => updateBike(v.id, v.bike),
    {
      successMessage: 'Bike updated',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload = {
      manufacturer: values.manufacturer,
      model: values.model,
      boughtAt: toISO(values.boughtAt),
      retiredAt: toISO(values.retiredAt),
    }
    if (initial) {
      updateMut.mutate({ id: initial.id, bike: { ...initial, ...payload } })
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
          name="manufacturer"
          render={({ field }) => (
            <TextField
              {...field}
              label="Manufacturer"
              required
              error={!!errors.manufacturer}
              helperText={errors.manufacturer?.message}
              autoFocus
            />
          )}
        />
        <Controller
          control={control}
          name="model"
          render={({ field }) => (
            <TextField
              {...field}
              label="Model"
              required
              error={!!errors.model}
              helperText={errors.model?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="boughtAt"
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
        <Controller
          control={control}
          name="retiredAt"
          render={({ field }) => (
            <DatePicker
              label="Retired Date"
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
