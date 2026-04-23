import { useEffect } from 'react'
import { MenuItem, Stack, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  partsQuery,
  partsQueryKey,
  partTypesQueryKey,
  relatePart,
} from '@/api/parts'
import type { PartType } from '@/types/api'

const schema = z
  .object({
    partId: z.string().uuid('Pick a part'),
    validFrom: z.date({ required_error: 'Valid From is required' }),
    validUntil: z.date().nullable(),
  })
  .refine((d) => !d.validUntil || d.validUntil > d.validFrom, {
    message: 'Valid Until must be after Valid From',
    path: ['validUntil'],
  })

type Values = z.infer<typeof schema>

const toISO = (d: Date | null | undefined) => (d ? d.toISOString() : null)

interface Props {
  open: boolean
  onClose: () => void
  partType: PartType
}

export const AddPartToTypeDialog = ({ open, onClose, partType }: Props) => {
  const qc = useQueryClient()
  const { data: parts } = useQuery(partsQuery())

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { partId: '', validFrom: new Date(), validUntil: null },
  })

  useEffect(() => {
    if (open) reset({ partId: '', validFrom: new Date(), validUntil: null })
  }, [open, reset])

  const addMut = useApiMutation(
    (v: Values) => {
      const part = parts?.find((p) => p.id === v.partId)
      if (!part) throw new Error('Part not found')
      return relatePart(part.id, {
        partId: part.id,
        partTypeId: partType.id,
        validFrom: toISO(v.validFrom)!,
        validUntil: toISO(v.validUntil),
        part: { id: part.id, name: part.name },
        partType: {
          id: partType.id,
          name: partType.name,
          mandatory: partType.mandatory,
        },
      })
    },
    {
      successMessage: 'Relation added',
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: partsQueryKey })
        qc.invalidateQueries({ queryKey: partTypesQueryKey })
        onClose()
      },
    },
  )

  const submit = handleSubmit((v) => addMut.mutate(v))

  return (
    <FormDialog
      open={open}
      title={`Add relation to "${partType.name}"`}
      onCancel={onClose}
      onSubmit={submit}
      submitting={addMut.isPending}
      submitLabel="Add"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Controller
          control={control}
          name="partId"
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Part"
              required
              error={!!errors.partId}
              helperText={errors.partId?.message}
            >
              {(parts ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          control={control}
          name="validFrom"
          render={({ field }) => (
            <DatePicker
              label="Valid From"
              value={field.value}
              onChange={field.onChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.validFrom,
                  helperText: errors.validFrom?.message,
                },
              }}
            />
          )}
        />
        <Controller
          control={control}
          name="validUntil"
          render={({ field }) => (
            <DatePicker
              label="Valid Until"
              value={field.value}
              onChange={field.onChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.validUntil,
                  helperText:
                    errors.validUntil?.message ??
                    'Leave empty if the part is currently in use',
                },
              }}
            />
          )}
        />
      </Stack>
    </FormDialog>
  )
}
