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
import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavEntry {
  to: string
  label: string
  icon: ReactNode
}

const entries: NavEntry[] = [
  { to: '/parts', label: 'Parts', icon: <SettingsIcon /> },
  { to: '/partTypes', label: 'Part Types', icon: <CategoryIcon /> },
  { to: '/bikes', label: 'Bikes', icon: <DirectionsBikeIcon /> },
  { to: '/tours', label: 'Tours', icon: <MapIcon /> },
  { to: '/tourImport', label: 'Import Tours', icon: <UploadFileIcon /> },
  { to: '/report', label: 'Report', icon: <AssessmentIcon /> },
]

export const NavList = () => (
  <List disablePadding>
    {entries.map(({ to, label, icon }) => (
      <ListItemButton
        key={to}
        component={NavLink}
        to={to}
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
