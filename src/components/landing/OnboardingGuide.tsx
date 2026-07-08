import { useState } from 'react'
import { Box, Collapse, Typography, useTheme } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useTranslation } from 'react-i18next'
import type { ParseKeys } from 'i18next'
import { StepCard } from './StepCard'
import componentTypesLight from '@/assets/landing/componentTypes_light.png'
import componentTypesDark from '@/assets/landing/componentTypes_dark.png'
import bikesLight from '@/assets/landing/bikes_light.png'
import bikesDark from '@/assets/landing/bikes_dark.png'
import componentsLight from '@/assets/landing/components_light.png'
import componentsDark from '@/assets/landing/components_dark.png'
import assembliesLight from '@/assets/landing/assemblies_light.png'
import assembliesDark from '@/assets/landing/assemblies_dark.png'
import tourImportLight from '@/assets/landing/tourImport_light.png'
import tourImportDark from '@/assets/landing/tourImport_dark.png'
import toursLight from '@/assets/landing/tours_light.png'
import toursDark from '@/assets/landing/tours_dark.png'
import maintenanceLight from '@/assets/landing/maintenance_light.png'
import maintenanceDark from '@/assets/landing/maintenance_dark.png'
import reportLight from '@/assets/landing/report_light.png'
import reportDark from '@/assets/landing/report_dark.png'

const steps: { to: string; titleKey: ParseKeys; bodyKey: ParseKeys; light: string; dark: string }[] = [
  {
    to: '/catalog',
    titleKey: 'nav.componentTypes',
    bodyKey: 'landing.guide.steps.componentTypes',
    light: componentTypesLight,
    dark: componentTypesDark,
  },
  {
    to: '/bikes',
    titleKey: 'nav.bikes',
    bodyKey: 'landing.guide.steps.bikes',
    light: bikesLight,
    dark: bikesDark,
  },
  {
    to: '/components',
    titleKey: 'nav.components',
    bodyKey: 'landing.guide.steps.components',
    light: componentsLight,
    dark: componentsDark,
  },
  {
    to: '/assemblies',
    titleKey: 'nav.assemblies',
    bodyKey: 'landing.guide.steps.assemblies',
    light: assembliesLight,
    dark: assembliesDark,
  },
  {
    to: '/tourImport',
    titleKey: 'nav.tourImport',
    bodyKey: 'landing.guide.steps.tourImport',
    light: tourImportLight,
    dark: tourImportDark,
  },
  {
    to: '/tours',
    titleKey: 'nav.tours',
    bodyKey: 'landing.guide.steps.tours',
    light: toursLight,
    dark: toursDark,
  },
  {
    to: '/maintenance',
    titleKey: 'nav.maintenance',
    bodyKey: 'landing.guide.steps.maintenance',
    light: maintenanceLight,
    dark: maintenanceDark,
  },
  {
    to: '/report',
    titleKey: 'nav.report',
    bodyKey: 'landing.guide.steps.report',
    light: reportLight,
    dark: reportDark,
  },
]

export const OnboardingGuide = () => {
  const { t } = useTranslation()
  const isDark = useTheme().palette.mode === 'dark'
  const [open, setOpen] = useState(true)
  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        <Box
          component="button"
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            p: 0,
            border: 0,
            background: 'none',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
          }}
        >
          {t('landing.guide.toggleLabel')}
          <ExpandMoreIcon
            fontSize="small"
            sx={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </Box>
      </Typography>
      <Collapse in={open}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            pb: 1,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
          }}
        >
          {steps.map((step, i) => (
            <StepCard
              key={step.to}
              step={i + 1}
              title={t(step.titleKey)}
              body={t(step.bodyKey)}
              to={step.to}
              imgSrc={isDark ? step.dark : step.light}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
