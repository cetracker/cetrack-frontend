import { useState } from 'react'
import { Alert, Autocomplete, Chip, Radio, RadioGroup, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import {
  invalidateAfterAssemblyMountingChanges,
  mountAssembly,
  planMountAssembly,
} from '@/api/assemblies'
import { bikesQuery, mountPointsQuery } from '@/api/bikes'
import { componentsQuery } from '@/api/components'
import type { Assembly, Bike, MountPlan, PlannedSlot } from '@/types/api'
import { bikeIdentity, componentIdentity, withLocalOffset } from '@/utils/formatters'
import { buildSlotResolutions, canSubmitMount } from '@/utils/assemblyMount'

interface MountAssemblyDialogProps {
  open: boolean
  onClose: () => void
  assembly: Assembly
}

const resolvedByLabel = (t: TFunction): Record<NonNullable<PlannedSlot['resolvedBy']>, string> => ({
  uniqueCandidate: t('assemblies.mount.resolvedByUniqueCandidate'),
  positionFilter: t('assemblies.mount.resolvedByPositionFilter'),
  slotMapping: t('assemblies.mount.resolvedBySlotMapping'),
})

export const MountAssemblyDialog = ({ open, onClose, assembly }: MountAssemblyDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [step, setStep] = useState<1 | 2>(1)
  const [bikeId, setBikeId] = useState<string | null>(null)
  const [at, setAt] = useState<Date | null>(new Date())
  const [plan, setPlan] = useState<MountPlan | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const { data: bikes } = useQuery({ ...bikesQuery(), enabled: open })
  const { data: mountPoints } = useQuery({
    ...mountPointsQuery(bikeId ?? ''),
    enabled: !!bikeId && step === 2,
  })
  const { data: components } = useQuery({ ...componentsQuery(), enabled: step === 2 })

  const bikeOptions = (bikes ?? []).filter((b) => !b.retiredAt)
  const mountPointNameById = new Map((mountPoints ?? []).map((mp) => [mp.id, mp.name]))
  const componentById = new Map((components ?? []).map((c) => [c.id, c]))
  const slotById = new Map(assembly.slots.map((s) => [s.id, s]))

  const resetAll = () => {
    setStep(1)
    setBikeId(null)
    setAt(new Date())
    setPlan(null)
    setAnswers({})
  }

  const handleClose = () => {
    resetAll()
    onClose()
  }

  const planMut = useApiMutation(
    (body: { bikeId: string; at: string }) => planMountAssembly(assembly.id, body),
    {
      onSuccess: (p) => {
        setPlan(p)
        setAnswers({})
        setStep(2)
      },
    },
  )

  const mountMut = useApiMutation(
    (body: { bikeId: string; at: string; slotResolutions: ReturnType<typeof buildSlotResolutions> }) =>
      mountAssembly(assembly.id, body),
    {
      onSuccess: async (result) => {
        await invalidateAfterAssemblyMountingChanges(qc, assembly.id)
        const parts: string[] = [t('assemblies.mount.successMessage')]
        if (result.rememberedSlotMappings?.length) {
          parts.push(
            t('assemblies.mount.rememberedAnswers', { count: result.rememberedSlotMappings.length }),
          )
        }
        if (result.changes.closed?.length) {
          parts.push(t('assemblies.mount.autoClosed', { count: result.changes.closed.length }))
        }
        notify(parts.join(' — '), 'success')
        handleClose()
      },
    },
  )

  const submitStep1 = () => {
    if (!bikeId || !at) return
    planMut.mutate({ bikeId, at: withLocalOffset(at) })
  }

  const submitStep2 = () => {
    if (!plan || !bikeId || !at) return
    mountMut.mutate({
      bikeId,
      at: withLocalOffset(at),
      slotResolutions: buildSlotResolutions(plan, answers),
    })
  }

  const step2Disabled = !plan || !canSubmitMount(plan, answers)

  return (
    <FormDialog
      open={open}
      title={t('assemblies.mount.title', { name: assembly.name })}
      onCancel={handleClose}
      onSubmit={step === 1 ? submitStep1 : submitStep2}
      submitting={planMut.isPending || mountMut.isPending}
      submitDisabled={step === 1 ? !bikeId || !at : step2Disabled}
      submitLabel={step === 1 ? t('assemblies.mount.nextButton') : t('components.detail.mountButton')}
    >
      {step === 1 ? (
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete<Bike>
            options={bikeOptions}
            value={bikeOptions.find((b) => b.id === bikeId) ?? null}
            onChange={(_, option) => setBikeId(option?.id ?? null)}
            getOptionLabel={(b) => bikeIdentity(b)}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderInput={(params) => (
              <TextField {...params} label={t('common.bike')} required autoFocus />
            )}
          />
          <DateTimePicker
            label={t('assemblies.mount.atLabel')}
            value={at}
            onChange={setAt}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ pt: 1 }}>
          {plan?.slots.map((ps) => {
            const slotName = slotById.get(ps.slotId)?.name ?? ps.slotId
            if (ps.state === 'empty') {
              return (
                <Typography key={ps.slotId} color="text.secondary">
                  {t('assemblies.mount.slotEmpty', { slotName })}
                </Typography>
              )
            }
            if (ps.state === 'impossible') {
              return (
                <Alert key={ps.slotId} severity="error">
                  <strong>{slotName}</strong>: {ps.reason}
                </Alert>
              )
            }
            if (ps.state === 'resolved') {
              const evicted = ps.willDismountComponentId
                ? componentById.get(ps.willDismountComponentId)
                : undefined
              return (
                <Stack key={ps.slotId} spacing={0.5}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography>
                      <strong>{slotName}</strong> →{' '}
                      {ps.mountPointId ? mountPointNameById.get(ps.mountPointId) ?? ps.mountPointId : ''}
                    </Typography>
                    {ps.resolvedBy && (
                      <Chip size="small" label={resolvedByLabel(t)[ps.resolvedBy]} />
                    )}
                  </Stack>
                  {evicted && (
                    <Alert severity="warning">
                      {t('assemblies.mount.willDismount', { name: componentIdentity(evicted) })}
                    </Alert>
                  )}
                </Stack>
              )
            }
            // unresolved
            return (
              <Stack key={ps.slotId} spacing={0.5}>
                <Typography>
                  <strong>{slotName}</strong> {t('assemblies.mount.chooseMountPointSuffix')}
                </Typography>
                <RadioGroup
                  value={answers[ps.slotId] ?? ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [ps.slotId]: e.target.value }))
                  }
                >
                  {(ps.candidates ?? []).map((c) => (
                    <FormControlLabel
                      key={c.mountPointId}
                      value={c.mountPointId}
                      control={<Radio size="small" />}
                      label={c.mountPointName}
                    />
                  ))}
                </RadioGroup>
              </Stack>
            )
          })}
        </Stack>
      )}
    </FormDialog>
  )
}
