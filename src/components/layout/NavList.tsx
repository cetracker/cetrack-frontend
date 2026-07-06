import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import CategoryIcon from '@mui/icons-material/Category'
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike'
import MapIcon from '@mui/icons-material/Map'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import BuildIcon from '@mui/icons-material/Build'
import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavEntry {
  to: string
  label: string
  icon: ReactNode
  tour: string
}

const entries: NavEntry[] = [
  { to: '/components', label: 'Components', icon: <SettingsIcon />, tour: 'components' },
  { to: '/catalog', label: 'Component Types', icon: <CategoryIcon />, tour: 'componentTypes' },
  { to: '/bikes', label: 'Bikes', icon: <DirectionsBikeIcon />, tour: 'bikes' },
  { to: '/assemblies', label: 'Assemblies', icon: <AccountTreeIcon />, tour: 'assemblies' },
  { to: '/maintenance', label: 'Maintenance', icon: <BuildIcon />, tour: 'maintenance' },
  { to: '/tours', label: 'Tours', icon: <MapIcon />, tour: 'tours' },
  { to: '/tourImport', label: 'Import Tours', icon: <UploadFileIcon />, tour: 'tourImport' },
  { to: '/report', label: 'Report', icon: <AssessmentIcon />, tour: 'report' },
]

interface NavListProps {
  onNavigate?: () => void
}

export const NavList = ({ onNavigate }: NavListProps) => (
  <List disablePadding>
    {entries.map(({ to, label, icon, tour }) => (
      <ListItemButton
        key={to}
        component={NavLink}
        to={to}
        onClick={onNavigate}
        data-tour={tour}
        sx={{
          '&.active': (theme) => ({
            bgcolor: theme.palette.action.selected,
            borderRight: `3px solid ${theme.palette.primary.main}`,
          }),
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    ))}
  </List>
)
