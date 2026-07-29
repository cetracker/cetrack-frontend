import { useState } from 'react'
import { MenuItem, Stack, TextField } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { bikeQueryKey, bikesQueryKey, correctBikeRetirement } from '@/api/bikes'
import type { RetirementKind } from '@/types/api'
import { RETIREMENT_KINDS, retirementKindLabel } from '@/utils/retirement'

interface CorrectBikeRetirementDialogProps {
  open: boolean
  onClose: () => void
  bikeId: string
  currentKind?: RetirementKind
  currentNote?: string
}

export const CorrectBikeRetirementDialog = ({
  open,
  onClose,
  bikeId,
  currentKind,
  currentNote,
}: CorrectBikeRetirementDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [kind, setKind] = useState<RetirementKind | ''>(currentKind ?? '')
  const [note, setNote] = useState(currentNote ?? '')

  // Re-seed from the current values every time the dialog (re)opens — a
  // dialog copied literally from RetireBikeDialog would default kind to a
  // constant and silently wipe an existing note on submit. A legacy bike
  // with no kind at all starts with an empty selection, not an invented one.
  // Adjusting state during render (not in an effect) per React's "resetting
  // state when a prop changes" pattern.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setKind(currentKind ?? '')
      setNote(currentNote ?? '')
    }
  }

  const correctMut = useApiMutation(
    (body: { kind: RetirementKind; note?: string }) => correctBikeRetirement(bikeId, body),
    {
      successMessage: t('retirement.correctSuccessMessage'),
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: bikesQueryKey })
        await qc.invalidateQueries({ queryKey: bikeQueryKey(bikeId) })
        onClose()
      },
    },
  )

  const submit = () => {
    if (!kind) return
    correctMut.mutate({ kind, note: note.trim() || undefined })
  }

  return (
    <FormDialog
      open={open}
      title={t('retirement.correctTitle')}
      onCancel={onClose}
      onSubmit={submit}
      submitting={correctMut.isPending}
      submitDisabled={!kind}
      submitLabel={t('common.save')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField
          select
          label={t('retirement.reasonLabel')}
          value={kind}
          onChange={(e) => setKind(e.target.value as RetirementKind)}
          autoFocus
        >
          {RETIREMENT_KINDS.map((k) => (
            <MenuItem key={k} value={k}>
              {retirementKindLabel(k)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t('retirement.noteLabel')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
      </Stack>
    </FormDialog>
  )
}
