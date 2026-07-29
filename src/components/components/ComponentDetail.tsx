import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'
import { componentQuery } from '@/api/components'
import { mountingsQuery } from '@/api/mountings'
import { membershipsQuery } from '@/api/memberships'
import { MountingHistoryTable } from '@/components/mountings/MountingHistoryTable'
import { DismountDialog } from './DismountDialog'
import { RetireComponentDialog } from './RetireComponentDialog'
import { CorrectComponentRetirementDialog } from './CorrectComponentRetirementDialog'
import { MountComponentDialog } from './MountComponentDialog'
import { formatDate, componentIdentity } from '@/utils/formatters'
import { activeMounting, componentStatusLabel } from '@/utils/components'
import { retirementKindLabel } from '@/utils/retirement'

interface ComponentDetailProps {
  open: boolean
  onClose: () => void
  componentId: string | null
}

const DRAWER_WIDTH = 560

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  inStock: 'default',
  inAssembly: 'info',
  mounted: 'success',
  retired: 'warning',
}

export const ComponentDetail = ({ open, onClose, componentId }: ComponentDetailProps) => {
  const { t } = useTranslation()
  const { data: component, isLoading } = useQuery({
    ...componentQuery(componentId ?? ''),
    enabled: !!componentId && open,
  })
  const { data: mountings } = useQuery({
    ...mountingsQuery({ componentId: componentId ?? '' }),
    enabled: !!componentId && open,
  })
  const { data: memberships } = useQuery({
    ...membershipsQuery({ componentId: componentId ?? '' }),
    enabled: !!componentId && open && component?.status === 'inAssembly',
  })

  const [mountOpen, setMountOpen] = useState(false)
  const [dismountOpen, setDismountOpen] = useState(false)
  const [retireOpen, setRetireOpen] = useState(false)
  const [correctRetirementOpen, setCorrectRetirementOpen] = useState(false)

  const mountedViaAssembly = component?.status === 'mounted' && !component?.directlyMounted
  const assemblyId = mountings ? activeMounting(mountings)?.assemblyId : undefined
  const membershipAssemblyId = memberships?.find((m) => !m.memberTo)?.assemblyId
  const linkAssemblyId = mountedViaAssembly ? assemblyId : membershipAssemblyId

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
            {componentIdentity(component) || (isLoading ? t('common.loading') : t('components.detail.fallbackTitle'))}
          </Typography>
          {component?.status && linkAssemblyId ? (
            <Chip
              label={componentStatusLabel(component)}
              color={STATUS_COLOR[component.status]}
              size="small"
              component={RouterLink}
              to={`/assemblies/${linkAssemblyId}`}
              clickable
              aria-label={t('components.detail.goToAssembly')}
              title={t('components.detail.goToAssembly')}
            />
          ) : (
            component?.status && (
              <Chip
                label={componentStatusLabel(component)}
                color={STATUS_COLOR[component.status]}
                size="small"
              />
            )
          )}
          <IconButton onClick={onClose} aria-label={t('components.detail.closeDrawer')}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {component && (
          <Box sx={{ mb: 2 }}>
            {(
              [
                [t('common.manufacturer'), component.manufacturer ?? ''],
                [t('common.model'), component.model ?? ''],
                [t('components.fields.serial'), component.serialNumber ?? ''],
                [t('components.fields.vendor'), component.vendor ?? ''],
                [
                  t('components.fields.price'),
                  component.price
                    ? `${component.price} ${component.priceCurrency ?? ''}`.trim()
                    : '',
                ],
                [t('components.fields.purchased'), formatDate(component.purchaseDate)],
                [
                  t('components.fields.firstUsed'),
                  formatDate(
                    mountings?.length
                      ? mountings.reduce(
                          (min, m) => (m.mountedAt < min ? m.mountedAt : min),
                          mountings[0].mountedAt,
                        )
                      : undefined,
                  ),
                ],
              ] as [string, string][]
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <Stack
                  key={k}
                  sx={{ flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {k}
                  </Typography>
                  <Typography variant="body2">{v}</Typography>
                </Stack>
              ))}
            {component.retiredAt && (
              <Stack sx={{ gap: 0.5 }}>
                <Stack sx={{ flexDirection: 'row', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('components.fields.retired')}
                  </Typography>
                  <Stack sx={{ flexDirection: 'row', gap: 0.5, alignItems: 'center' }}>
                    <Typography variant="body2">{formatDate(component.retiredAt)}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => setCorrectRetirementOpen(true)}
                      aria-label={t('components.detail.editRetirementAriaLabel')}
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </Stack>
                {component.retirementKind && (
                  <Stack sx={{ flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('retirement.reasonLabel')}
                    </Typography>
                    <Typography variant="body2">
                      {retirementKindLabel(component.retirementKind)}
                    </Typography>
                  </Stack>
                )}
                {component.retirementNote && (
                  <Stack sx={{ flexDirection: 'row', gap: 1, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('retirement.noteLabel')}
                    </Typography>
                    <Typography variant="body2">{component.retirementNote}</Typography>
                  </Stack>
                )}
              </Stack>
            )}
          </Box>
        )}

        <Divider />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('components.detail.mountingHistoryTitle')}
          </Typography>
          {mountings ? (
            <MountingHistoryTable mountings={mountings} perspective="component" />
          ) : (
            <Typography color="text.secondary">{t('common.loading')}</Typography>
          )}
        </Box>

        {component && (
          <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setMountOpen(true)}
              disabled={component.status !== 'inStock'}
              fullWidth
            >
              {t('components.detail.mountButton')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setDismountOpen(true)}
              disabled={component.status !== 'mounted'}
              fullWidth
            >
              {t('components.detail.dismountButton')}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setRetireOpen(true)}
              disabled={component.status === 'mounted' || component.status === 'retired'}
              fullWidth
            >
              {t('components.detail.retireButton')}
            </Button>
          </Stack>
        )}

        {component && (
          <>
            <MountComponentDialog
              open={mountOpen}
              onClose={() => setMountOpen(false)}
              component={component}
            />
            <DismountDialog
              open={dismountOpen}
              onClose={() => setDismountOpen(false)}
              componentId={component.id}
            />
            <RetireComponentDialog
              open={retireOpen}
              onClose={() => setRetireOpen(false)}
              componentId={component.id}
            />
            <CorrectComponentRetirementDialog
              open={correctRetirementOpen}
              onClose={() => setCorrectRetirementOpen(false)}
              componentId={component.id}
              currentKind={component.retirementKind}
              currentNote={component.retirementNote}
            />
          </>
        )}
      </Box>
    </Drawer>
  )
}
