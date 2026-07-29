import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Alert, Box, Button, Stack, Tab, Tabs } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { bikeQuery } from '@/api/bikes'
import { mountingsQuery } from '@/api/mountings'
import { MountingHistoryTable } from '@/components/mountings/MountingHistoryTable'
import { CompositionTable } from './CompositionTable'
import { BikeCompositionAtDate } from './BikeCompositionAtDate'
import { BikeForm } from './BikeForm'
import { RetireBikeDialog } from './RetireBikeDialog'
import { BikeMaintenanceTab } from './BikeMaintenanceTab'
import { bikeIdentity } from '@/utils/formatters'

export const BikeDetail = () => {
  const { t } = useTranslation()
  const { bikeId } = useParams<{ bikeId: string }>()
  const navigate = useNavigate()
  const { data: bike, isLoading } = useQuery({
    ...bikeQuery(bikeId ?? ''),
    enabled: !!bikeId,
  })
  const { data: history } = useQuery({
    ...mountingsQuery({ bikeId: bikeId ?? '' }),
    enabled: !!bikeId,
  })

  const [tab, setTab] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [retireOpen, setRetireOpen] = useState(false)

  if (!bikeId) return null

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/bikes')}
        size="small"
        sx={{ mb: 1 }}
      >
        {t('bikes.detail.backButton')}
      </Button>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>
          {bikeIdentity(bike) || (isLoading ? t('common.loading') : t('bikes.detail.fallbackTitle'))}
        </Box>
        {bike && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              {t('bikes.detail.editButton')}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setRetireOpen(true)}
              disabled={!!bike.retiredAt}
            >
              {t('bikes.detail.retireButton')}
            </Button>
          </Stack>
        )}
      </Stack>

      {bike?.retiredAt && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('bikes.detail.retiredBanner')}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={t('bikes.detail.compositionTab')} />
        <Tab label={t('bikes.detail.historyTab')} />
        <Tab label={t('bikes.detail.maintenanceTab')} />
      </Tabs>

      {tab === 0 && <CompositionTable bikeId={bikeId} />}
      {tab === 1 && (
        <Stack spacing={3}>
          <BikeCompositionAtDate bikeId={bikeId} />
          <MountingHistoryTable mountings={history ?? []} perspective="bike" />
        </Stack>
      )}
      {tab === 2 && <BikeMaintenanceTab bikeId={bikeId} />}

      {bike && (
        <>
          <BikeForm open={editOpen} onClose={() => setEditOpen(false)} initial={bike} />
          <RetireBikeDialog
            open={retireOpen}
            onClose={() => setRetireOpen(false)}
            bikeId={bike.id}
          />
        </>
      )}
    </Box>
  )
}
