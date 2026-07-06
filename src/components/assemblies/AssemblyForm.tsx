import { useEffect } from 'react'
import { MenuItem, Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { createAssembly, updateAssembly, assembliesQueryKey } from '@/api/assemblies'
import { positionsQuery } from '@/api/catalog'
import type { Assembly, AssemblyInput } from '@/types/api'

const NONE = '__none__'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  positionId: z.string(),
})

type Values = z.infer<typeof schema>

interface AssemblyFormProps {
  open: boolean
  onClose: () => void
  initial?: Assembly | null
}

export const AssemblyForm = ({ open, onClose, initial }: AssemblyFormProps) => {
  const qc = useQueryClient()
  const { data: positions } = useQuery(positionsQuery())

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', positionId: NONE },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        positionId: initial?.positionId ?? NONE,
      })
    }
  }, [open, initial, reset])

  const invalidate = async () =>
    qc.invalidateQueries({ queryKey: assembliesQueryKey })

  const createMut = useApiMutation(createAssembly, {
    successMessage: 'Assembly created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: AssemblyInput }) => updateAssembly(v.id, v.data),
    {
      successMessage: 'Assembly updated',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: AssemblyInput = {
      name: values.name.trim(),
      positionId: values.positionId === NONE ? undefined : values.positionId,
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
      title={initial ? 'Edit Assembly' : 'Add Assembly'}
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
          name="positionId"
          render={({ field }) => (
            <TextField {...field} select label="Position">
              <MenuItem value={NONE}>(none)</MenuItem>
              {(positions ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>
    </FormDialog>
  )
}
