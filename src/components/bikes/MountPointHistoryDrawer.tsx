import { useMemo, useState } from 'react'
import { Box, Button, Drawer, IconButton, Stack, Toolbar, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { componentsQuery } from '@/api/components'
import { mountingsQuery } from '@/api/mountings'
import { MountingHistoryTable } from '@/components/mountings/MountingHistoryTable'
import { MountDialog } from './MountDialog'
import { ReuseMountDialog } from './ReuseMountDialog'
import type { MountPoint } from '@/types/api'
import { componentIdentity } from '@/utils/formatters'
import { activeMounting, isComponentRetired, reuseCandidateComponentIds } from '@/utils/components'

interface MountPointHistoryDrawerProps {
  open: boolean
  onClose: () => void
  bikeId: string
  mountPoint: MountPoint | null
}

const DRAWER_WIDTH = 560

export const MountPointHistoryDrawer = ({
  open,
  onClose,
  bikeId,
  mountPoint,
}: MountPointHistoryDrawerProps) => {
  const { t } = useTranslation()
  const [mountOtherOpen, setMountOtherOpen] = useState(false)
  const [reuseComponentId, setReuseComponentId] = useState<string | null>(null)

  const { data: mountings } = useQuery({
    ...mountingsQuery({ mountPointId: mountPoint?.id ?? '' }),
    enabled: !!mountPoint && open,
  })
  const { data: components } = useQuery({
    ...componentsQuery(),
    enabled: !!mountPoint && open,
  })

  const componentById = useMemo(
    () => new Map((components ?? []).map((c) => [c.id, c])),
    [components],
  )

  const active = mountings ? activeMounting(mountings) : undefined
  const activeComponent = active ? componentById.get(active.componentId) : undefined

  const reuseIds = useMemo(() => {
    if (!mountings) return []
    return reuseCandidateComponentIds(mountings).filter((id) => {
      const c = componentById.get(id)
      return !!c && !isComponentRetired(c)
    })
  }, [mountings, componentById])

  const reuseComponent = reuseComponentId ? componentById.get(reuseComponentId) : undefined

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100vw', sm: DRAWER_WIDTH }, maxWidth: '100vw' } },
      }}
    >
      <Toolbar />
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: {
            xs: 'calc(100% - 56px)',
            sm: 'calc(100% - 64px)',
          },
        }}
      >
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {mountPoint?.name ?? t('bikes.mountPointHistory.fallbackTitle')}
          </Typography>
          <IconButton onClick={onClose} aria-label={t('components.detail.closeDrawer')}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 1 }}>
          {mountings ? (
            <MountingHistoryTable
              mountings={mountings}
              perspective="bike"
              onReuse={setReuseComponentId}
              reuseComponentIds={reuseIds}
            />
          ) : (
            <Typography color="text.secondary">{t('common.loading')}</Typography>
          )}
        </Box>

        <Stack sx={{ pt: 2 }}>
          <Button variant="outlined" onClick={() => setMountOtherOpen(true)} fullWidth>
            {t('bikes.mountPointHistory.mountOtherButton')}
          </Button>
        </Stack>
      </Box>

      <MountDialog
        open={mountOtherOpen}
        onClose={() => setMountOtherOpen(false)}
        bikeId={bikeId}
        mountPoint={mountPoint}
      />

      {mountPoint && reuseComponent && (
        <ReuseMountDialog
          open={!!reuseComponentId}
          onClose={() => setReuseComponentId(null)}
          bikeId={bikeId}
          mountPointId={mountPoint.id}
          componentId={reuseComponent.id}
          componentName={componentIdentity(reuseComponent)}
          activeComponentName={activeComponent ? componentIdentity(activeComponent) : undefined}
        />
      )}
    </Drawer>
  )
}
