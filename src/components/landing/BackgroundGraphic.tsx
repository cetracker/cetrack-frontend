import { Box, useTheme } from '@mui/material'
import bgLight from '@/assets/landing/background_light.png'
import bgDark from '@/assets/landing/background_dark.png'

export const BackgroundGraphic = () => {
  const isDark = useTheme().palette.mode === 'dark'
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        backgroundImage: `url(${isDark ? bgDark : bgLight})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        opacity: isDark ? 0.22 : 0.3,
        pointerEvents: 'none',
      }}
    />
  )
}
