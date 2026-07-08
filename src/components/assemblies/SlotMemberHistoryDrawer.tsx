import { useMemo, useState } from 'react'
import { Box, Button, Drawer, IconButton, Stack, Toolbar, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { componentsQuery } from '@/api/components'
import { membershipsQuery } from '@/api/memberships'
import { MembershipHistoryTable } from './MembershipHistoryTable'
import { AddMemberDialog } from './AddMemberDialog'
import { ReuseMemberDialog } from './ReuseMemberDialog'
import type { Assembly, AssemblySlot } from '@/types/api'
import { componentIdentity } from '@/utils/formatters'
import { isComponentRetired, reuseCandidateMemberComponentIds } from '@/utils/components'

interface SlotMemberHistoryDrawerProps {
  open: boolean
  onClose: () => void
  assemblyId: string
  assembly: Assembly
  slot: AssemblySlot | null
}

const DRAWER_WIDTH = 560

export const SlotMemberHistoryDrawer = ({
  open,
  onClose,
  assemblyId,
  assembly,
  slot,
}: SlotMemberHistoryDrawerProps) => {
  const { t } = useTranslation()
  const [addOtherOpen, setAddOtherOpen] = useState(false)
  const [reuseComponentId, setReuseComponentId] = useState<string | null>(null)

  const { data: memberships } = useQuery({
    ...membershipsQuery({ slotId: slot?.id ?? '' }),
    enabled: !!slot && open,
  })
  const { data: components } = useQuery({
    ...componentsQuery(),
    enabled: !!slot && open,
  })

  const componentById = useMemo(
    () => new Map((components ?? []).map((c) => [c.id, c])),
    [components],
  )

  const active = memberships?.find((m) => !m.memberTo)
  const activeComponent = active ? componentById.get(active.componentId) : undefined

  const reuseIds = useMemo(() => {
    if (!memberships) return []
    return reuseCandidateMemberComponentIds(memberships).filter((id) => {
      const c = componentById.get(id)
      if (!c || isComponentRetired(c)) return false
      if (c.status === 'inAssembly') return false
      if (!assembly.mounted && c.status === 'mounted') return false
      return true
    })
  }, [memberships, componentById, assembly.mounted])

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
            {slot?.name ?? t('assemblies.slotMemberHistory.fallbackTitle')}
          </Typography>
          <IconButton onClick={onClose} aria-label={t('components.detail.closeDrawer')}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 1 }}>
          {memberships ? (
            <MembershipHistoryTable
              memberships={memberships}
              onReuse={setReuseComponentId}
              reuseComponentIds={reuseIds}
            />
          ) : (
            <Typography color="text.secondary">{t('common.loading')}</Typography>
          )}
        </Box>

        <Stack sx={{ pt: 2 }}>
          <Button variant="outlined" onClick={() => setAddOtherOpen(true)} fullWidth>
            {t('assemblies.slotMemberHistory.addOtherButton')}
          </Button>
        </Stack>
      </Box>

      <AddMemberDialog
        open={addOtherOpen}
        onClose={() => setAddOtherOpen(false)}
        assemblyId={assemblyId}
        assembly={assembly}
        slot={slot}
      />

      {slot && reuseComponent && (
        <ReuseMemberDialog
          open={!!reuseComponentId}
          onClose={() => setReuseComponentId(null)}
          assemblyId={assemblyId}
          slotId={slot.id}
          componentId={reuseComponent.id}
          componentName={componentIdentity(reuseComponent)}
          activeComponentName={activeComponent ? componentIdentity(activeComponent) : undefined}
          assemblyMounted={assembly.mounted}
        />
      )}
    </Drawer>
  )
}
