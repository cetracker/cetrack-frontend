import { useEffect } from 'react'
import { Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createPart,
  partsQueryKey,
  partQueryKey,
  updatePart,
} from '@/api/parts'
import type { Part } from '@/types/api'
import { useQueryClient } from '@tanstack/react-query'

const schema = z
  .object({
    label: z.string(),
    manufacturer: z.string(),
    model: z.string(),
    serialNumber: z.string(),
    vendor: z.string(),
    purchasePrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'Use a decimal like 10.57')
      .or(z.literal('')),
    purchasePriceCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/, 'ISO 4217 code, e.g. EUR')
      .or(z.literal('')),
    firstUsedDate: z.date().nullable(),
    boughtAt: z.date().nullable(),
    retiredAt: z.date().nullable(),
  })
  .refine((d) => !!d.label.trim() || !!d.model.trim(), {
    message: 'Provide at least a label or a model',
    path: ['label'],
  })
  .refine(
    (d) => !!d.purchasePrice.trim() === !!d.purchasePriceCurrency.trim(),
    { message: 'Currency is required when a price is set (and vice versa)', path: ['purchasePriceCurrency'] },
  )

export type PartFormValues = z.infer<typeof schema>

const toISO = (d: Date | null) => (d ? d.toISOString() : null)
const fromISO = (s: string | null | undefined) => (s ? new Date(s) : null)
const blankToUndef = (s: string) => (s.trim() ? s.trim() : undefined)

const emptyValues: PartFormValues = {
  label: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  vendor: '',
  purchasePrice: '',
  purchasePriceCurrency: '',
  firstUsedDate: null,
  boughtAt: null,
  retiredAt: null,
}

interface PartFormProps {
  open: boolean
  onClose: () => void
  initial?: Part | null
}

export const PartForm = ({ open, onClose, initial }: PartFormProps) => {
  const qc = useQueryClient()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      reset({
        label: initial?.label ?? '',
        manufacturer: initial?.manufacturer ?? '',
        model: initial?.model ?? '',
        serialNumber: initial?.serialNumber ?? '',
        vendor: initial?.vendor ?? '',
        purchasePrice: initial?.purchasePrice ?? '',
        purchasePriceCurrency: initial?.purchasePriceCurrency ?? '',
        firstUsedDate: fromISO(initial?.firstUsedDate),
        boughtAt: fromISO(initial?.boughtAt),
        retiredAt: fromISO(initial?.retiredAt),
      })
    }
  }, [open, initial, reset])

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: partsQueryKey })
    if (initial) await qc.invalidateQueries({ queryKey: partQueryKey(initial.id) })
  }

  const createMut = useApiMutation(createPart, {
    successMessage: 'Part created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; part: Part }) => updatePart(v.id, v.part),
    {
      successMessage: 'Part updated',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload = {
      label: blankToUndef(values.label),
      manufacturer: blankToUndef(values.manufacturer),
      model: blankToUndef(values.model),
      serialNumber: blankToUndef(values.serialNumber),
      vendor: blankToUndef(values.vendor),
      purchasePrice: blankToUndef(values.purchasePrice),
      purchasePriceCurrency: blankToUndef(values.purchasePriceCurrency),
      firstUsedDate: toISO(values.firstUsedDate),
      boughtAt: toISO(values.boughtAt),
      retiredAt: toISO(values.retiredAt),
    }
    if (initial) {
      updateMut.mutate({ id: initial.id, part: { ...initial, ...payload } })
    } else {
      createMut.mutate(payload)
    }
  })

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <FormDialog
      open={open}
      title={initial ? 'Edit Part' : 'Add Part'}
      onCancel={onClose}
      onSubmit={submit}
      submitting={submitting}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Controller
          control={control}
          name="label"
          render={({ field }) => (
            <TextField
              {...field}
              label="Label"
              error={!!errors.label}
              helperText={
                errors.label?.message ?? 'A nickname; optional if a model is given'
              }
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
            name="purchasePrice"
            render={({ field }) => (
              <TextField
                {...field}
                label="Purchase Price"
                fullWidth
                error={!!errors.purchasePrice}
                helperText={errors.purchasePrice?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="purchasePriceCurrency"
            render={({ field }) => (
              <TextField
                {...field}
                label="Currency"
                sx={{ width: 130 }}
                error={!!errors.purchasePriceCurrency}
                helperText={errors.purchasePriceCurrency?.message}
              />
            )}
          />
        </Stack>
        <Controller
          control={control}
          name="firstUsedDate"
          render={({ field }) => (
            <DatePicker
              label="First Used Date"
              displayWeekNumber
              value={field.value}
              onChange={field.onChange}
              slotProps={{ textField: { fullWidth: true } }}
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
