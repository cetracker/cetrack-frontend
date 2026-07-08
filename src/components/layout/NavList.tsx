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
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import type { ReactNode } from 'react'

interface NavEntry {
  to: string
  labelKey: ParseKeys
  icon: ReactNode
  tour: string
}

const entries: NavEntry[] = [
  { to: '/components', labelKey: 'nav.components', icon: <SettingsIcon />, tour: 'components' },
  { to: '/catalog', labelKey: 'nav.componentTypes', icon: <CategoryIcon />, tour: 'componentTypes' },
  { to: '/bikes', labelKey: 'nav.bikes', icon: <DirectionsBikeIcon />, tour: 'bikes' },
  { to: '/assemblies', labelKey: 'nav.assemblies', icon: <AccountTreeIcon />, tour: 'assemblies' },
  { to: '/maintenance', labelKey: 'nav.maintenance', icon: <BuildIcon />, tour: 'maintenance' },
  { to: '/tours', labelKey: 'nav.tours', icon: <MapIcon />, tour: 'tours' },
  { to: '/tourImport', labelKey: 'nav.tourImport', icon: <UploadFileIcon />, tour: 'tourImport' },
  { to: '/report', labelKey: 'nav.report', icon: <AssessmentIcon />, tour: 'report' },
]

interface NavListProps {
  onNavigate?: () => void
}

export const NavList = ({ onNavigate }: NavListProps) => {
  const { t } = useTranslation()
  return (
    <List disablePadding>
      {entries.map(({ to, labelKey, icon, tour }) => (
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
          <ListItemText primary={t(labelKey)} />
        </ListItemButton>
      ))}
    </List>
  )
}
