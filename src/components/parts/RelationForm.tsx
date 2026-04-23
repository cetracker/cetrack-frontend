import { useEffect } from 'react'
import {
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { DatePicker } from '@mui/x-date-pickers'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import {
  partQueryKey,
  partTypeQueryKey,
  partTypesQuery,
  partsQueryKey,
  relatePart,
  updatePart,
} from '@/api/parts'
import type {
  Part,
  PartPartTypeRelation,
  PartType,
} from '@/types/api'
import { bikeName } from '@/utils/formatters'

const schema = z
  .object({
    partId: z.string().uuid(),
    partTypeId: z.string().uuid('Part type is required'),
    validFrom: z.date({ required_error: 'Valid From is required' }),
    validUntil: z.date().nullable(),
  })
  .refine(
    (d) => !d.validUntil || d.validUntil > d.validFrom,
    {
      message: 'Valid Until must be after Valid From',
      path: ['validUntil'],
    },
  )

type Values = z.infer<typeof schema>

const toISO = (d: Date | null | undefined) => (d ? d.toISOString() : null)
const fromISO = (s: string | null | undefined) => (s ? new Date(s) : null)

interface RelationFormProps {
  open: boolean
  onClose: () => void
  part: Part
  /** Existing relation being edited, or null/undefined when adding. */
  initial?: PartPartTypeRelation | null
  /** Optional: pre-select this part type (e.g., from Part Type drawer). */
  lockedPartTypeId?: string
}

export const RelationForm = ({
  open,
  onClose,
  part,
  initial,
  lockedPartTypeId,
}: RelationFormProps) => {
  const qc = useQueryClient()
  const { data: partTypes } = useQuery(partTypesQuery())

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      partId: part.id,
      partTypeId: '',
      validFrom: new Date(),
      validUntil: null,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        partId: part.id,
        partTypeId:
          initial?.partTypeId ??
          lockedPartTypeId ??
          '',
        validFrom: fromISO(initial?.validFrom) ?? new Date(),
        validUntil: fromISO(initial?.validUntil),
      })
    }
  }, [open, initial, part.id, lockedPartTypeId, reset])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: partsQueryKey })
    qc.invalidateQueries({ queryKey: partQueryKey(part.id) })
    const ptId = watch('partTypeId')
    if (ptId) qc.invalidateQueries({ queryKey: partTypeQueryKey(ptId) })
  }

  const addMut = useApiMutation(
    (relation: Parameters<typeof relatePart>[1]) => relatePart(part.id, relation),
    {
      successMessage: 'Relation added',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  // For editing an existing relation we update the part's relations array via PUT /parts/{id}.
  const updateMut = useApiMutation(
    (updated: Part) => updatePart(part.id, updated),
    {
      successMessage: 'Relation updated',
      onSuccess: () => {
        invalidate()
        onClose()
      },
    },
  )

  const selectedPartType: PartType | undefined = partTypes?.find(
    (pt) => pt.id === watch('partTypeId'),
  )

  const submit = handleSubmit((values) => {
    const pt = partTypes?.find((p) => p.id === values.partTypeId)
    if (!pt) return
    if (initial) {
      const next: Part = {
        ...part,
        partTypeRelations: (part.partTypeRelations ?? []).map((r) =>
          r.partTypeId === initial.partTypeId && r.validFrom === initial.validFrom
            ? {
                ...r,
                partTypeId: values.partTypeId,
                validFrom: toISO(values.validFrom)!,
                validUntil: toISO(values.validUntil),
                partType: pt,
              }
            : r,
        ),
      }
      updateMut.mutate(next)
    } else {
      addMut.mutate({
        partId: part.id,
        partTypeId: values.partTypeId,
        validFrom: toISO(values.validFrom)!,
        validUntil: toISO(values.validUntil),
        part: { id: part.id, name: part.name },
        partType: {
          id: pt.id,
          name: pt.name,
          mandatory: pt.mandatory,
        },
      })
    }
  })

  const submitting = addMut.isPending || updateMut.isPending

  return (
    <FormDialog
      open={open}
      title={initial ? 'Edit Relation' : 'Add Relation'}
      onCancel={onClose}
      onSubmit={submit}
      submitting={submitting}
      submitLabel={
        initial ? 'Save' : 'Add'
      }
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Controller
          control={control}
          name="partTypeId"
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Part Type"
              required
              error={!!errors.partTypeId}
              helperText={errors.partTypeId?.message}
              disabled={!!lockedPartTypeId}
              InputProps={{
                endAdornment: selectedPartType?.bike ? (
                  <InputAdornment position="end" sx={{ mr: 3 }}>
                    {bikeName(selectedPartType.bike)}
                  </InputAdornment>
                ) : undefined,
              }}
            >
              {(partTypes ?? []).map((pt) => (
                <MenuItem key={pt.id} value={pt.id}>
                  {pt.name}
                  {pt.bike ? ` — ${bikeName(pt.bike)}` : ''}
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
        {!initial && (
          <Tooltip
            title="An active relation for a different part with this part type will be terminated automatically at midnight before 'Valid From'."
            placement="top"
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
              <IconButton size="small" tabIndex={-1}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
              <span>Previous active relation is terminated automatically.</span>
            </Stack>
          </Tooltip>
        )}
      </Stack>
    </FormDialog>
  )
}
