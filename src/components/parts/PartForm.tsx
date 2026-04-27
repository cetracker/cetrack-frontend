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

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  boughtAt: z.date().nullable(),
  retiredAt: z.date().nullable(),
})

export type PartFormValues = z.infer<typeof schema>

const toISO = (d: Date | null) => (d ? d.toISOString() : null)
const fromISO = (s: string | null | undefined) => (s ? new Date(s) : null)

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
    defaultValues: { name: '', boughtAt: null, retiredAt: null },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        boughtAt: fromISO(initial?.boughtAt),
        retiredAt: fromISO(initial?.retiredAt),
      })
    }
  }, [open, initial, reset])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: partsQueryKey })
    if (initial) qc.invalidateQueries({ queryKey: partQueryKey(initial.id) })
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
      name: values.name,
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
          name="name"
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              required
              error={!!errors.name}
              helperText={errors.name?.message}
              autoFocus
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
