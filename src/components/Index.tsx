import { useState } from 'react'
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingGuide } from './landing/OnboardingGuide'
import { BackgroundGraphic } from './landing/BackgroundGraphic'
import { WelcomeDialog } from './onboarding/WelcomeDialog'

const TAGLINE =
  "Every component, every ride — see how your gear wears and plan maintenance before it's overdue."

export const Index = () => {
  const { onboarded, startTour, finishTour } = useOnboarding()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // First-time visitors are greeted with an opt-in dialog rather than an auto-dimming
  // tour. Snapshotted at mount so it never re-appears mid-session; the nav-spotlight
  // tour is desktop-only.
  const [welcomeOpen, setWelcomeOpen] = useState(!onboarded && !isMobile)

  const handleTakeTour = () => {
    setWelcomeOpen(false)
    startTour()
  }

  const handleDismiss = () => {
    setWelcomeOpen(false)
    finishTour()
  }

  return (
    <Box sx={{ position: 'relative', maxWidth: 960, mx: 'auto', minHeight: '70vh' }}>
      <BackgroundGraphic />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ maxWidth: 620 }}>
          {TAGLINE}
        </Typography>
        <Button size="small" onClick={startTour} sx={{ flexShrink: 0 }}>
          Take the tour
        </Button>
      </Box>
      <OnboardingGuide />
      <WelcomeDialog open={welcomeOpen} onTakeTour={handleTakeTour} onDismiss={handleDismiss} />
    </Box>
  )
}
