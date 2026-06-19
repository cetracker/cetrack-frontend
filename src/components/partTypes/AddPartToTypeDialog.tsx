import { useEffect, useMemo, useState } from 'react'
import { Autocomplete, Stack, TextField, Typography } from '@mui/material'
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
import {
  partDisambiguator,
  partIdentity,
  toLocalDayEndISO,
  toLocalDayStartISO,
} from '@/utils/formatters'
import { isPartSelectableOn } from '@/utils/parts'

const schema = z
  .object({
    partId: z.string().uuid('Pick a part'),
    validFrom: z.date(),
    validUntil: z.date().nullable(),
  })
  .refine((d) => !d.validUntil || d.validUntil > d.validFrom, {
    message: 'Valid Until must be after Valid From',
    path: ['validUntil'],
  })

type Values = z.infer<typeof schema>


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
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { partId: '', validFrom: new Date(), validUntil: null },
  })

  const [staleHint, setStaleHint] = useState(false)

  useEffect(() => {
    if (open) {
      reset({ partId: '', validFrom: new Date(), validUntil: null })
      setStaleHint(false)
    }
  }, [open, reset])

  const partId = watch('partId')
  const validFrom = watch('validFrom')
  const validFromMs = validFrom.getTime()

  const allSorted = useMemo(
    () => (parts ?? []).slice().sort((a, b) => partIdentity(a).localeCompare(partIdentity(b))),
    [parts],
  )

  const visibleParts = useMemo(
    () => allSorted.filter((p) => isPartSelectableOn(p, new Date(validFromMs))),
    [allSorted, validFromMs],
  )

  const selectedInVisible = Boolean(partId) && visibleParts.some((p) => p.id === partId)

  useEffect(() => {
    if (partId && !selectedInVisible) {
      setValue('partId', '')
      setStaleHint(true)
    }
  }, [partId, selectedInVisible, setValue])

  useEffect(() => {
    if (partId && selectedInVisible) {
      setStaleHint(false)
    }
  }, [partId, selectedInVisible])

  const addMut = useApiMutation(
    (v: Values) => {
      const part = parts?.find((p) => p.id === v.partId)
      if (!part) throw new Error('Part not found')
      return relatePart(part.id, {
        partId: part.id,
        partTypeId: partType.id,
        validFrom: toLocalDayStartISO(v.validFrom)!,
        validUntil: toLocalDayEndISO(v.validUntil),
        part: { id: part.id, label: part.label },
        partType: {
          id: partType.id,
          name: partType.name,
          mandatory: partType.mandatory,
        },
      })
    },
    {
      successMessage: 'Relation added',
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: partsQueryKey })
        await qc.invalidateQueries({ queryKey: partTypesQueryKey })
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
            <Autocomplete
              options={visibleParts}
              value={parts?.find((p) => p.id === field.value) ?? null}
              onChange={(_, option) => field.onChange(option?.id ?? '')}
              getOptionLabel={partIdentity}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              clearOnBlur={false}
              noOptionsText={
                visibleParts.length === 0
                  ? 'No parts active as of the selected date'
                  : 'No matching parts'
              }
              renderOption={({ key: _key, ...props }, p) => {
                const detail = partDisambiguator(p)
                return (
                  <li key={p.id} {...props}>
                    <Stack>
                      <span>{partIdentity(p)}</span>
                      {detail && (
                        <Typography variant="caption" color="text.secondary">
                          {detail}
                        </Typography>
                      )}
                    </Stack>
                  </li>
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Part"
                  required
                  error={!!errors.partId}
                  helperText={
                    staleHint
                      ? 'Previously selected part is retired as of this date'
                      : errors.partId?.message
                  }
                  inputRef={field.ref}
                />
              )}
            />
          )}
        />
        <Controller
          control={control}
          name="validFrom"
          render={({ field }) => (
            <DatePicker
              label="Valid From"
              displayWeekNumber
              value={field.value}
              onChange={field.onChange}
               slotProps={{
                 textField: {
                   fullWidth: true,
                   required: true,
                   error: !!errors.validFrom,
                   helperText: errors.validFrom?.message ? String(errors.validFrom.message) : undefined,
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
              displayWeekNumber
              value={field.value}
              onChange={field.onChange}
                slotProps={{
                 textField: {
                   fullWidth: true,
                   error: !!errors.validUntil,
                   helperText:
                     (errors.validUntil?.message ? String(errors.validUntil.message) : undefined) ??
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
