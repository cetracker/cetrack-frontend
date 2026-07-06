import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Stack, Tab, Tabs } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useQuery } from '@tanstack/react-query'
import { bikeQuery } from '@/api/bikes'
import { mountingsQuery } from '@/api/mountings'
import { MountingHistoryTable } from '@/components/mountings/MountingHistoryTable'
import { CompositionTable } from './CompositionTable'
import { BikeForm } from './BikeForm'
import { RetireBikeDialog } from './RetireBikeDialog'
import { bikeIdentity } from '@/utils/formatters'

export const BikeDetail = () => {
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
        Back to bikes
      </Button>

      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ typography: 'h5' }}>
          {bikeIdentity(bike) || (isLoading ? 'Loading…' : 'Bike')}
        </Box>
        {bike && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => setRetireOpen(true)}
              disabled={!!bike.retiredAt}
            >
              Retire
            </Button>
          </Stack>
        )}
      </Stack>

      {bike?.retiredAt && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Retired — no new tours or mountings.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Composition" />
        <Tab label="History" />
      </Tabs>

      {tab === 0 ? (
        <CompositionTable bikeId={bikeId} />
      ) : (
        <MountingHistoryTable mountings={history ?? []} perspective="bike" />
      )}

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
