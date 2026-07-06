import { useEffect } from 'react'
import { MenuItem, Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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

const schema = z.object({
  componentTypeId: z.string().min(1, 'Component type required'),
  label: z.string().min(1, 'Label required'),
  manufacturer: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  vendor: z.string(),
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

type Values = z.infer<typeof schema>

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
  const qc = useQueryClient()
  const { data: componentTypes } = useQuery(componentTypesQuery())

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
    successMessage: 'Component created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: ComponentInput }) => updateComponent(v.id, v.data),
    {
      successMessage: 'Component updated',
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
      title={initial ? 'Edit Component' : 'Add Component'}
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
              label="Component Type"
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
              label="Label"
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
          render={({ field }) => <TextField {...field} label="Manufacturer" />}
        />
        <Controller
          control={control}
          name="model"
          render={({ field }) => <TextField {...field} label="Model" />}
        />
        <Controller
          control={control}
          name="serialNumber"
          render={({ field }) => <TextField {...field} label="Serial Number" />}
        />
        <Controller
          control={control}
          name="vendor"
          render={({ field }) => <TextField {...field} label="Vendor" />}
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
      </Stack>
    </FormDialog>
  )
}
