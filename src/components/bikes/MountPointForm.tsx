import { useEffect, useMemo } from 'react'
import { Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
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

const buildSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    componentTypeId: z.string().min(1, t('validation.componentTypeRequired')),
    positionId: z.string(),
    mandatory: z.boolean(),
  })

type Values = z.infer<ReturnType<typeof buildSchema>>

interface MountPointFormProps {
  open: boolean
  onClose: () => void
  bikeId: string
  initial?: MountPoint | null
}

export const MountPointForm = ({ open, onClose, bikeId, initial }: MountPointFormProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const { data: positions } = useQuery(positionsQuery())
  const schema = useMemo(() => buildSchema(t), [t])

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
      successMessage: t('bikes.mountPoint.createdSuccess'),
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
      successMessage: t('bikes.mountPoint.updatedSuccess'),
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
      title={initial ? t('bikes.mountPoint.editTitle') : t('bikes.mountPoint.addTitle')}
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
              label={t('common.name')}
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
              label={t('common.componentType')}
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
            <TextField {...field} select label={t('bikes.mountPoint.positionLabel')}>
              <MenuItem value={NONE}>{t('bikes.mountPoint.noneOption')}</MenuItem>
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
              label={t('bikes.mountPoint.mandatoryLabel')}
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
