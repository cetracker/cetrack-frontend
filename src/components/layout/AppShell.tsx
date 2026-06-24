import { Suspense, useState } from 'react'
import {
  AppBar,
  Badge,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PedalBikeIcon from '@mui/icons-material/PedalBike'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { pendingMyTourbookSessionQuery } from '@/api/tours'
import { NavList } from './NavList'
import { useColorMode } from '@/hooks/useColorMode'

const ImportAttentionIndicator = () => {
  const { data: session } = useQuery(pendingMyTourbookSessionQuery())
  if (!session) return null

  const hasLogicalDuplicate = session.warnings.some((w) => w.type === 'LOGICAL_DUPLICATE')

  if (hasLogicalDuplicate) {
    return (
      <Tooltip title="Import needs attention — duplicate tours detected">
        <IconButton color="inherit" component={RouterLink} to="/mytourbookImport" aria-label="review import">
          <NotificationImportantIcon color="error" />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Tooltip title="Import pending review">
      <IconButton color="inherit" component={RouterLink} to="/mytourbookImport" aria-label="review import">
        <Badge variant="dot" color="default">
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  )
}

const DRAWER_WIDTH = 220

export const AppShell = () => {
  const { mode, toggle } = useColorMode()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setMobileNavOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
            aria-label="home"
          >
            <PedalBikeIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Cycling Equipment Usage Tracker
          </Typography>
          <ImportAttentionIndicator />
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton color="inherit" onClick={toggle}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileNavOpen : true}
        onClose={() => setMobileNavOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <NavList onNavigate={isMobile ? () => setMobileNavOpen(false) : undefined} />
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          minWidth: 0,
        }}
      >
        <Toolbar />
        <Suspense
          fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          }
        >
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  )
}
