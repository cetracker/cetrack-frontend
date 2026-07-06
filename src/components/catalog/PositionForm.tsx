import { useEffect } from 'react'
import { Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createPosition,
  positionQueryKey,
  positionsQueryKey,
  updatePosition,
} from '@/api/catalog'
import type { Position, PositionInput } from '@/types/api'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
})

type Values = z.infer<typeof schema>

interface PositionFormProps {
  open: boolean
  onClose: () => void
  initial?: Position | null
}

export const PositionForm = ({ open, onClose, initial }: PositionFormProps) => {
  const qc = useQueryClient()

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
    successMessage: 'Position created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: PositionInput }) => updatePosition(v.id, v.data),
    {
      successMessage: 'Position updated',
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
      title={initial ? 'Edit Position' : 'Add Position'}
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
      </Stack>
    </FormDialog>
  )
}
