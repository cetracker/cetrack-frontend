import { useEffect } from 'react'
import { Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  componentTypeQueryKey,
  componentTypesQueryKey,
  createComponentType,
  updateComponentType,
} from '@/api/catalog'
import type { ComponentType, ComponentTypeInput } from '@/types/api'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string(),
})

type Values = z.infer<typeof schema>

interface ComponentTypeFormProps {
  open: boolean
  onClose: () => void
  initial?: ComponentType | null
}

export const ComponentTypeForm = ({ open, onClose, initial }: ComponentTypeFormProps) => {
  const qc = useQueryClient()

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
    successMessage: 'Component type created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: ComponentTypeInput }) =>
      updateComponentType(v.id, v.data),
    {
      successMessage: 'Component type updated',
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
      title={initial ? 'Edit Component Type' : 'Add Component Type'}
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
          name="description"
          render={({ field }) => (
            <TextField {...field} label="Description" multiline minRows={2} />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
