import { Suspense, useState } from 'react'
import {
  AppBar,
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
import PedalBikeIcon from '@mui/icons-material/PedalBike'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NavList } from './NavList'
import { ImportAttentionIndicator } from './ImportAttentionIndicator'
import { MaintenanceDueIndicator } from './MaintenanceDueIndicator'
import { VersionInfo } from './VersionInfo'
import { LanguageSwitcher } from './LanguageSwitcher'
import { FormatSwitcher } from './FormatSwitcher'
import { useColorMode } from '@/hooks/useColorMode'
import { GuidedTour } from '@/components/onboarding/GuidedTour'

const DRAWER_WIDTH = 220

export const AppShell = () => {
  const { t } = useTranslation()
  const { mode, toggle } = useColorMode()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <GuidedTour />
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
            aria-label={t('appShell.openNavigation')}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
            aria-label={t('appShell.home')}
          >
            <PedalBikeIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {t('appShell.title')}
          </Typography>
          <ImportAttentionIndicator />
          <MaintenanceDueIndicator />
          <LanguageSwitcher />
          <FormatSwitcher />
          <Tooltip title={mode === 'dark' ? t('appShell.lightMode') : t('appShell.darkMode')}>
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
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <NavList onNavigate={isMobile ? () => setMobileNavOpen(false) : undefined} />
        </Box>
        <VersionInfo />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          minWidth: 0,
          height: '100dvh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
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
