import { useMemo, useState } from 'react'
import {
  Autocomplete,
  Checkbox,
  Chip,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormDialog } from '@/components/common/FormDialog'
import { useApiMutation } from '@/hooks/useApiMutation'
import { useNotify } from '@/hooks/useNotify'
import { mountComponent } from '@/api/bikes'
import { componentsQuery } from '@/api/components'
import { invalidateAfterMountingChanges, mountingsQuery } from '@/api/mountings'
import type { Component, MountPoint } from '@/types/api'
import { componentDisambiguator, componentIdentity, withLocalOffset } from '@/utils/formatters'
import { isComponentRetired, reuseCandidateComponentIds } from '@/utils/components'

interface MountDialogProps {
  open: boolean
  onClose: () => void
  bikeId: string
  mountPoint: MountPoint | null
}

export const MountDialog = ({ open, onClose, bikeId, mountPoint }: MountDialogProps) => {
  const qc = useQueryClient()
  const { notify } = useNotify()
  const [componentId, setComponentId] = useState<string | null>(null)
  const [at, setAt] = useState<Date | null>(new Date())
  const [includeMounted, setIncludeMounted] = useState(false)

  const { data: components } = useQuery({
    ...componentsQuery(mountPoint ? { componentTypeId: mountPoint.componentTypeId } : {}),
    enabled: !!mountPoint && open,
  })

  const { data: history } = useQuery({
    ...mountingsQuery({ mountPointId: mountPoint?.id ?? '' }),
    enabled: !!mountPoint && open,
  })

  const componentById = useMemo(
    () => new Map((components ?? []).map((c) => [c.id, c])),
    [components],
  )

  const options = useMemo(() => {
    const unretired = (components ?? []).filter((c) => !isComponentRetired(c))
    return includeMounted ? unretired : unretired.filter((c) => c.status === 'inStock')
  }, [components, includeMounted])

  const reuseCandidates = useMemo(() => {
    if (!history) return []
    return reuseCandidateComponentIds(history)
      .map((id) => componentById.get(id))
      .filter((c): c is Component => !!c && !isComponentRetired(c))
  }, [history, componentById])

  const mountMut = useApiMutation(
    (body: { componentId: string; at: string }) =>
      mountComponent(bikeId, mountPoint!.id, body),
    {
      onSuccess: async (changes) => {
        await invalidateAfterMountingChanges(qc)
        if (changes.closed?.length) {
          notify(
            `Mounted — auto-closed ${changes.closed.length} previous mounting${changes.closed.length > 1 ? 's' : ''}`,
            'success',
          )
        } else {
          notify('Component mounted', 'success')
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
      title={mountPoint ? `Mount to ${mountPoint.name}` : 'Mount'}
      onCancel={() => {
        reset()
        onClose()
      }}
      onSubmit={submit}
      submitting={mountMut.isPending}
      submitDisabled={!componentId || !at}
      submitLabel="Mount"
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {reuseCandidates.length > 0 && (
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Previously used here
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {reuseCandidates.map((c) => (
                <Chip
                  key={c.id}
                  label={componentIdentity(c)}
                  size="small"
                  clickable
                  color={componentId === c.id ? 'primary' : 'default'}
                  onClick={() => {
                    setComponentId(c.id)
                    if (c.status !== 'inStock') setIncludeMounted(true)
                  }}
                />
              ))}
            </Stack>
          </Stack>
        )}
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
            <TextField {...params} label="Component" required autoFocus />
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
          label="Include currently mounted (swap)"
        />
        <DateTimePicker
          label="Mounted at"
          value={at}
          onChange={setAt}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </Stack>
    </FormDialog>
  )
}
