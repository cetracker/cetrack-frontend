import { useEffect } from 'react'
import {
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { BikeSelect } from '@/components/common/BikeSelect'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createPartType,
  partTypeQueryKey,
  partTypesQueryKey,
  updatePartType,
} from '@/api/parts'
import { bikesQuery } from '@/api/bikes'
import type { PartType } from '@/types/api'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  bikeId: z.string().nullable(),
  mandatory: z.boolean(),
})

type Values = z.infer<typeof schema>

interface PartTypeFormProps {
  open: boolean
  onClose: () => void
  initial?: PartType | null
}

export const PartTypeForm = ({ open, onClose, initial }: PartTypeFormProps) => {
  const qc = useQueryClient()
  const { data: bikes } = useQuery(bikesQuery())

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bikeId: null, mandatory: false },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        bikeId: initial?.bike?.id ?? null,
        mandatory: initial?.mandatory ?? false,
      })
    }
  }, [open, initial, reset])

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: partTypesQueryKey })
    if (initial) await qc.invalidateQueries({ queryKey: partTypeQueryKey(initial.id) })
  }

  const createMut = useApiMutation(createPartType, {
    successMessage: 'Part type created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; pt: PartType }) => updatePartType(v.id, v.pt),
    {
      successMessage: 'Part type updated',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const bike =
      values.bikeId ? bikes?.find((b) => b.id === values.bikeId) ?? null : null
    const payload: PartType = {
      id: initial?.id ?? '',
      name: values.name,
      mandatory: values.mandatory,
      bike,
      partTypeRelations: initial?.partTypeRelations,
    }
    if (initial) {
      updateMut.mutate({ id: initial.id, pt: payload })
    } else {
      createMut.mutate(payload)
    }
  })

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <FormDialog
      open={open}
      title={initial ? 'Edit Part Type' : 'Add Part Type'}
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
          name="bikeId"
          render={({ field }) => (
            <BikeSelect
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="mandatory"
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label="Mandatory (bike cannot be ridden without this part type)"
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
