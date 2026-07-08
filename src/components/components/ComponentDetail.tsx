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
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { componentQuery } from '@/api/components'
import { mountingsQuery } from '@/api/mountings'
import { MountingHistoryTable } from '@/components/mountings/MountingHistoryTable'
import { DismountDialog } from './DismountDialog'
import { RetireComponentDialog } from './RetireComponentDialog'
import { MountComponentDialog } from './MountComponentDialog'
import { formatDate, componentIdentity } from '@/utils/formatters'
import { componentStatusLabel } from '@/utils/components'

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

  const [mountOpen, setMountOpen] = useState(false)
  const [dismountOpen, setDismountOpen] = useState(false)
  const [retireOpen, setRetireOpen] = useState(false)

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
          {component?.status && (
            <Chip
              label={componentStatusLabel(component)}
              color={STATUS_COLOR[component.status]}
              size="small"
            />
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
                [t('components.fields.retired'), formatDate(component.retiredAt)],
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
          </>
        )}
      </Box>
    </Drawer>
  )
}
