import { useEffect } from 'react'
import { Stack, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  partQueryKey,
  partTypeQueryKey,
  partsQueryKey,
  relatePart,
} from '@/api/parts'
import type { PartPartTypeRelation, PartType } from '@/types/api'

const schema = z.object({
  validFrom: z.date({ required_error: 'Valid From is required' }),
})

type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  partType: PartType
  relation: PartPartTypeRelation | null
}

export const ReusePartDialog = ({ open, onClose, partType, relation }: Props) => {
  const qc = useQueryClient()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { validFrom: new Date() },
  })

  useEffect(() => {
    if (open) reset({ validFrom: new Date() })
  }, [open, reset])

  const reuseMut = useApiMutation(
    (v: Values) => {
      if (!relation) throw new Error('No relation selected')
      return relatePart(relation.partId, {
        partId: relation.partId,
        partTypeId: partType.id,
        validFrom: v.validFrom.toISOString(),
        validUntil: null,
        part: { id: relation.partId, name: relation.part.name },
        partType: {
          id: partType.id,
          name: partType.name,
          mandatory: partType.mandatory,
        },
      })
    },
    {
      successMessage: 'Part re-used as active',
      onSuccess: () => {
        if (relation) {
          qc.invalidateQueries({ queryKey: partQueryKey(relation.partId) })
        }
        qc.invalidateQueries({ queryKey: partsQueryKey })
        qc.invalidateQueries({ queryKey: partTypeQueryKey(partType.id) })
        onClose()
      },
    },
  )

  const submit = handleSubmit((v) => reuseMut.mutate(v))

  return (
    <FormDialog
      open={open}
      title={`Re-use "${relation?.part.name ?? ''}"`}
      onCancel={onClose}
      onSubmit={submit}
      submitting={reuseMut.isPending}
      submitLabel="Re-use"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          A new active relation will be created; the currently active relation
          for this part type will be terminated automatically.
        </Typography>
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
      </Stack>
    </FormDialog>
  )
}
