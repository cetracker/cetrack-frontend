import { useMemo, useState } from 'react'
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { mountComponent } from '@/api/bikes'
import { componentsQuery } from '@/api/components'
import { invalidateAfterMountingChanges } from '@/api/mountings'
import type { Component, MountPoint } from '@/types/api'
import { componentDisambiguator, componentIdentity, withLocalOffset } from '@/utils/formatters'
import { isComponentRetired } from '@/utils/components'

interface MountDialogProps {
  open: boolean
  onClose: () => void
  bikeId: string
  mountPoint: MountPoint | null
}

export const MountDialog = ({ open, onClose, bikeId, mountPoint }: MountDialogProps) => {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [componentId, setComponentId] = useState<string | null>(null)
  const [at, setAt] = useState<Date | null>(new Date())
  const [includeMounted, setIncludeMounted] = useState(false)

  const { data: components } = useQuery({
    ...componentsQuery(mountPoint ? { componentTypeId: mountPoint.componentTypeId } : {}),
    enabled: !!mountPoint && open,
  })

  const options = useMemo(() => {
    const unretired = (components ?? []).filter((c) => !isComponentRetired(c))
    return includeMounted ? unretired : unretired.filter((c) => c.status === 'inStock')
  }, [components, includeMounted])

  const mountMut = useApiMutation(
    (body: { componentId: string; at: string }) =>
      mountComponent(bikeId, mountPoint!.id, body),
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
        onClose()
      },
    },
  )

  const submit = () => {
    if (!componentId || !at) return
    mountMut.mutate({ componentId, at: withLocalOffset(at) })
  }

  const reset = () => {
    setComponentId(null)
    setAt(new Date())
    setIncludeMounted(false)
  }

  return (
    <FormDialog
      open={open}
      title={mountPoint ? t('bikes.mountDialog.titleWithPoint', { name: mountPoint.name }) : t('components.detail.mountButton')}
      onCancel={() => {
        reset()
        onClose()
      }}
      onSubmit={submit}
      submitting={mountMut.isPending}
      submitDisabled={!componentId || !at}
      submitLabel={t('components.detail.mountButton')}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Autocomplete<Component>
          options={options}
          value={options.find((c) => c.id === componentId) ?? null}
          onChange={(_, option) => setComponentId(option?.id ?? null)}
          getOptionLabel={(c) => componentIdentity(c)}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderOption={({ key: _key, ...props }, c) => (
            <li key={c.id} {...props}>
              <Stack>
                <span>{componentIdentity(c)}</span>
                {componentDisambiguator(c) && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--mui-palette-text-secondary)' }}>
                    {componentDisambiguator(c)}
                  </span>
                )}
              </Stack>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label={t('components.list.columns.component')} required autoFocus />
          )}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={includeMounted}
              onChange={(e) => {
                setIncludeMounted(e.target.checked)
                setComponentId(null)
              }}
            />
          }
          label={t('bikes.mountDialog.includeMountedLabel')}
        />
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
