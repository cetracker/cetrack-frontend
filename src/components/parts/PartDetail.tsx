import { useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { useQuery } from '@tanstack/react-query'
import { partQuery } from '@/api/parts'
import { RelationTable } from './RelationTable'
import { RelationForm } from './RelationForm'
import type { PartPartTypeRelation } from '@/types/api'
import { formatDate, partIdentity } from '@/utils/formatters'

interface PartDetailProps {
  open: boolean
  onClose: () => void
  partId: string | null
}

const DRAWER_WIDTH = 560

export const PartDetail = ({ open, onClose, partId }: PartDetailProps) => {
  const { data: part, isLoading } = useQuery({
    ...partQuery(partId ?? ''),
    enabled: !!partId && open,
  })

  const [relationOpen, setRelationOpen] = useState(false)
  const [editRelation, setEditRelation] = useState<PartPartTypeRelation | null>(null)

  const openAdd = () => {
    setEditRelation(null)
    setRelationOpen(true)
  }

  const openEdit = (r: PartPartTypeRelation) => {
    setEditRelation(r)
    setRelationOpen(true)
  }

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
             {partIdentity(part) || (isLoading ? 'Loading…' : 'Part')}
           </Typography>
           <IconButton onClick={onClose} aria-label="Close drawer">
             <CloseIcon />
           </IconButton>
         </Stack>

        {part && (
          <Box sx={{ mb: 2 }}>
            {(
              [
                ['Manufacturer', part.manufacturer ?? ''],
                ['Model', part.model ?? ''],
                ['Serial', part.serialNumber ?? ''],
                ['Vendor', part.vendor ?? ''],
                [
                  'Price',
                  part.purchasePrice
                    ? `${part.purchasePrice} ${part.purchasePriceCurrency ?? ''}`.trim()
                    : '',
                ],
                ['First used', formatDate(part.firstUsedDate)],
                ['Purchased', formatDate(part.boughtAt)],
                ['Retired', formatDate(part.retiredAt)],
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
            Relations
          </Typography>
          {part ? (
            <RelationTable part={part} onEdit={openEdit} mode="part" />
          ) : (
            <Typography color="text.secondary">Loading…</Typography>
          )}
        </Box>

        <Box sx={{ pt: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            disabled={!part}
            fullWidth
          >
            Add relation
          </Button>
        </Box>

        {part && (
          <RelationForm
            open={relationOpen}
            onClose={() => setRelationOpen(false)}
            part={part}
            initial={editRelation}
          />
        )}
      </Box>
    </Drawer>
  )
}
