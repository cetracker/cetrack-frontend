import type { Tour } from '@/types/api'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { IconButton } from '@mui/material'

interface TourActionsCellProps {
  tour: Tour
  onOpenMenu: (tour: Tour, el: HTMLElement) => void
}

export const TourActionsCell = ({ tour, onOpenMenu }: TourActionsCellProps) => (
  <IconButton
    size="small"
    onClick={(e) => {
      e.stopPropagation()
      onOpenMenu(tour, e.currentTarget)
    }}
  >
    <MoreVertIcon fontSize="small" />
  </IconButton>
)
