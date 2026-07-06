import { useEffect } from 'react'
import { Autocomplete, Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { createMaintenanceTask, invalidateMaintenance, updateMaintenanceTask } from '@/api/maintenance'
import { bikesQuery } from '@/api/bikes'
import type { Bike, MaintenanceTask, MaintenanceTaskInput, UUID } from '@/types/api'
import { bikeIdentity } from '@/utils/formatters'

const KM_TO_M = 1000
const DAYS_TO_S = 86_400

/** Validates the raw entry AND the rounded wire value — a sub-unit entry
 *  (e.g. 0.0004 km -> 0m) must never reach the server's `minimum: 1`. */
const positiveRoundedIssue = (raw: string, factor: number): string | null => {
  if (!raw.trim()) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 'Must be a positive number'
  if (Math.round(n * factor) < 1) return 'Too small at this precision'
  return null
}

const schema = z
  .object({
    name: z.string().min(1, 'Name required'),
    bikeId: z.string().min(1, 'Bike required'),
    distanceKm: z.string(),
    timeDays: z.string(),
  })
  .superRefine((values, ctx) => {
    const distanceIssue = positiveRoundedIssue(values.distanceKm, KM_TO_M)
    if (distanceIssue) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['distanceKm'], message: distanceIssue })
    }
    const timeIssue = positiveRoundedIssue(values.timeDays, DAYS_TO_S)
    if (timeIssue) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['timeDays'], message: timeIssue })
    }
    if (!values.distanceKm.trim() && !values.timeDays.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['distanceKm'],
        message: 'Set a distance or a time interval (or both)',
      })
    }
  })

type Values = z.infer<typeof schema>

interface MaintenanceTaskFormProps {
  open: boolean
  onClose: () => void
  initial?: MaintenanceTask | null
  fixedBikeId?: UUID
}

export const MaintenanceTaskForm = ({
  open,
  onClose,
  initial,
  fixedBikeId,
}: MaintenanceTaskFormProps) => {
  const qc = useQueryClient()
  const { data: bikes } = useQuery(bikesQuery())
  const bikeOptions = (bikes ?? []).filter((b) => !b.retiredAt)
  const bikeLocked = !!initial || !!fixedBikeId

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bikeId: '', distanceKm: '', timeDays: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? '',
        bikeId: initial?.bikeId ?? fixedBikeId ?? '',
        distanceKm: initial?.distanceInterval != null ? String(initial.distanceInterval / KM_TO_M) : '',
        timeDays: initial?.timeInterval != null ? String(initial.timeInterval / DAYS_TO_S) : '',
      })
    }
  }, [open, initial, fixedBikeId, reset])

  const invalidate = () => invalidateMaintenance(qc)

  const createMut = useApiMutation(createMaintenanceTask, {
    successMessage: 'Maintenance task created',
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: MaintenanceTaskInput }) => updateMaintenanceTask(v.id, v.data),
    {
      successMessage: 'Maintenance task updated',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const submit = handleSubmit((values) => {
    const payload: MaintenanceTaskInput = {
      bikeId: values.bikeId,
      name: values.name.trim(),
      ...(values.distanceKm.trim() && {
        distanceInterval: Math.round(Number(values.distanceKm) * KM_TO_M),
      }),
      ...(values.timeDays.trim() && {
        timeInterval: Math.round(Number(values.timeDays) * DAYS_TO_S),
      }),
    }
    if (initial) {
      updateMut.mutate({ id: initial.id, data: payload })
    } else {
      createMut.mutate(payload)
    }
  })

  const submitting = createMut.isPending || updateMut.isPending
  const lockedBikeName = bikeIdentity(
    (bikes ?? []).find((b) => b.id === (initial?.bikeId ?? fixedBikeId)),
  )

  return (
    <FormDialog
      open={open}
      title={initial ? 'Edit Maintenance Task' : 'Add Maintenance Task'}
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
        {bikeLocked ? (
          <TextField label="Bike" value={lockedBikeName} disabled fullWidth />
        ) : (
          <Controller
            control={control}
            name="bikeId"
            render={({ field }) => (
              <Autocomplete<Bike>
                options={bikeOptions}
                value={bikeOptions.find((b) => b.id === field.value) ?? null}
                onChange={(_, option) => field.onChange(option?.id ?? '')}
                getOptionLabel={(b) => bikeIdentity(b)}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Bike"
                    required
                    error={!!errors.bikeId}
                    helperText={errors.bikeId?.message}
                  />
                )}
              />
            )}
          />
        )}
        <Controller
          control={control}
          name="distanceKm"
          render={({ field }) => (
            <TextField
              {...field}
              label="Distance interval (km)"
              error={!!errors.distanceKm}
              helperText={errors.distanceKm?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="timeDays"
          render={({ field }) => (
            <TextField
              {...field}
              label="Time interval (days)"
              error={!!errors.timeDays}
              helperText={errors.timeDays?.message}
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
