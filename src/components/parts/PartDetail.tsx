import { useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import { useQuery } from '@tanstack/react-query'
import { partQuery } from '@/api/parts'
import { RelationTable } from './RelationTable'
import { RelationForm } from './RelationForm'
import type { PartPartTypeRelation } from '@/types/api'
import { formatDate } from '@/utils/formatters'

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
      PaperProps={{ sx: { width: DRAWER_WIDTH, maxWidth: '100vw' } }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {part?.name ?? (isLoading ? 'Loading…' : 'Part')}
          </Typography>
          <IconButton onClick={onClose} aria-label="Close drawer">
            <CloseIcon />
          </IconButton>
        </Stack>

        {part && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {part.boughtAt && `Purchased ${formatDate(part.boughtAt)}`}
            {part.boughtAt && part.retiredAt && ' · '}
            {part.retiredAt && `Retired ${formatDate(part.retiredAt)}`}
          </Typography>
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
