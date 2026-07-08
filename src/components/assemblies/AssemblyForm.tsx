import { useEffect, useMemo } from 'react'
import { MenuItem, Stack, TextField } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { createAssembly, updateAssembly, assembliesQueryKey } from '@/api/assemblies'
import { positionsQuery } from '@/api/catalog'
import type { Assembly, AssemblyInput } from '@/types/api'

const NONE = '__none__'

const buildSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    positionId: z.string(),
  })

type Values = z.infer<ReturnType<typeof buildSchema>>

interface AssemblyFormProps {
  open: boolean
  onClose: () => void
  initial?: Assembly | null
}

export const AssemblyForm = ({ open, onClose, initial }: AssemblyFormProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: positions } = useQuery(positionsQuery())
  const schema = useMemo(() => buildSchema(t), [t])

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
    successMessage: t('assemblies.form.createdSuccess'),
    onSuccess: () => {
      invalidate()
      onClose()
    },
  })

  const updateMut = useApiMutation(
    (v: { id: string; data: AssemblyInput }) => updateAssembly(v.id, v.data),
    {
      successMessage: t('assemblies.form.updatedSuccess'),
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
      title={initial ? t('assemblies.form.editTitle') : t('assemblies.form.addTitle')}
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
          name="positionId"
          render={({ field }) => (
            <TextField {...field} select label={t('common.position')}>
              <MenuItem value={NONE}>{t('bikes.mountPoint.noneOption')}</MenuItem>
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
