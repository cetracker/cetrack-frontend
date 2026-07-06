import { useEffect } from 'react'
import { Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  createMountPoint,
  mountPointsQueryKey,
  updateMountPoint,
} from '@/api/bikes'
import { componentTypesQuery, positionsQuery } from '@/api/catalog'
import type { MountPoint, MountPointInput } from '@/types/api'

const NONE = '__none__'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  componentTypeId: z.string().min(1, 'Component type required'),
  positionId: z.string(),
  mandatory: z.boolean(),
})

type Values = z.infer<typeof schema>

interface MountPointFormProps {
  open: boolean
  onClose: () => void
  bikeId: string
  initial?: MountPoint | null
}

export const MountPointForm = ({ open, onClose, bikeId, initial }: MountPointFormProps) => {
  const qc = useQueryClient()
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const { data: positions } = useQuery(positionsQuery())

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', componentTypeId: '', positionId: NONE, mandatory: false },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        componentTypeId: initial?.componentTypeId ?? '',
        positionId: initial?.positionId ?? NONE,
        mandatory: initial?.mandatory ?? false,
      })
    }
  }, [open, initial, reset])

  const invalidate = async () =>
    qc.invalidateQueries({ queryKey: mountPointsQueryKey(bikeId) })

  const createMut = useApiMutation(
    (data: MountPointInput) => createMountPoint(bikeId, data),
    {
      successMessage: 'Mount point added',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const updateMut = useApiMutation(
    (v: { id: string; data: MountPointInput }) =>
      updateMountPoint(bikeId, v.id, v.data),
    {
      successMessage: 'Mount point updated',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: MountPointInput = {
      name: values.name.trim(),
      componentTypeId: values.componentTypeId,
      positionId: values.positionId === NONE ? undefined : values.positionId,
      mandatory: values.mandatory,
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
      title={initial ? 'Edit Mount Point' : 'Add Mount Point'}
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
              label="Mandatory (bike cannot be ridden without this mount point filled)"
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
