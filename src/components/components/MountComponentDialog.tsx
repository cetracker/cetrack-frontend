import { useMemo, useState } from 'react'
import { Alert, Autocomplete, Stack, TextField, Typography } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { mountComponent, bikesQuery, mountPointsQuery } from '@/api/bikes'
import { componentsQuery } from '@/api/components'
import { invalidateAfterMountingChanges, mountingsQuery } from '@/api/mountings'
import type { Bike, Component, MountPoint, MountRequest } from '@/types/api'
import { bikeIdentity, componentIdentity, withLocalOffset } from '@/utils/formatters'

interface MountComponentDialogProps {
  open: boolean
  onClose: () => void
  component: Component
}

export const MountComponentDialog = ({ open, onClose, component }: MountComponentDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [bikeId, setBikeId] = useState<string | null>(null)
  const [mountPointId, setMountPointId] = useState<string | null>(null)
  const [at, setAt] = useState<Date | null>(new Date())
  const now = useMemo(() => new Date().toISOString(), [])

  const { data: bikes } = useQuery({ ...bikesQuery(), enabled: open })
  const bikeOptions = (bikes ?? []).filter((b) => !b.retiredAt)

  const { data: mountPoints } = useQuery({
    ...mountPointsQuery(bikeId ?? ''),
    enabled: !!bikeId && open,
  })
  const mountPointOptions = (mountPoints ?? []).filter(
    (mp) => mp.componentTypeId === component.componentTypeId,
  )

  const { data: activeMountings } = useQuery({
    ...mountingsQuery({ bikeId: bikeId ?? '', activeAt: now }),
    enabled: !!bikeId && open,
  })
  const { data: components } = useQuery({ ...componentsQuery(), enabled: open })
  const componentById = new Map((components ?? []).map((c) => [c.id, c]))
  const occupantByMountPointId = new Map(
    (activeMountings ?? []).map((m) => [m.mountPointId, componentById.get(m.componentId)]),
  )

  const selectedOccupant = mountPointId ? occupantByMountPointId.get(mountPointId) : undefined

  const reset = () => {
    setBikeId(null)
    setMountPointId(null)
    setAt(new Date())
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const mountMut = useApiMutation(
    (body: MountRequest) => mountComponent(bikeId!, mountPointId!, body),
    {
      onSuccess: async (changes) => {
        await invalidateAfterMountingChanges(qc)
        if (changes.closed?.length) {
          notify(
            t('components.mount.autoClosedNotice', { count: changes.closed.length }),
            'success',
          )
        } else {
          notify(t('components.mount.successMessage'), 'success')
        }
        handleClose()
      },
    },
  )

  const submit = () => {
    if (!bikeId || !mountPointId || !at) return
    mountMut.mutate({ componentId: component.id, at: withLocalOffset(at) })
  }

  return (
    <FormDialog
      open={open}
      title={t('components.mount.title', { identity: componentIdentity(component) })}
      onCancel={handleClose}
      onSubmit={submit}
      submitting={mountMut.isPending}
      submitDisabled={!bikeId || !mountPointId || !at}
      submitLabel={t('components.detail.mountButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Autocomplete<Bike>
          options={bikeOptions}
          value={bikeOptions.find((b) => b.id === bikeId) ?? null}
          onChange={(_, option) => {
            setBikeId(option?.id ?? null)
            setMountPointId(null)
          }}
          getOptionLabel={(b) => bikeIdentity(b)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField {...params} label={t('common.bike')} required autoFocus />
          )}
        />
        <Autocomplete<MountPoint>
          options={mountPointOptions}
          value={mountPointOptions.find((mp) => mp.id === mountPointId) ?? null}
          onChange={(_, option) => setMountPointId(option?.id ?? null)}
          getOptionLabel={(mp) => {
            const occupant = occupantByMountPointId.get(mp.id)
            return occupant
              ? t('components.mount.occupantOption', { name: mp.name, identity: componentIdentity(occupant) })
              : mp.name
          }}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          disabled={!bikeId}
          renderInput={(params) => (
            <TextField {...params} label={t('components.mount.mountPointLabel')} required />
          )}
        />
        {bikeId && mountPointOptions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('components.mount.noCompatiblePoints')}
          </Typography>
        )}
        {selectedOccupant && (
          <Alert severity="warning">
            {t('components.mount.dismountWarning', { identity: componentIdentity(selectedOccupant) })}
          </Alert>
        )}
        <DateTimePicker
          label={t('components.mount.atLabel')}
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
