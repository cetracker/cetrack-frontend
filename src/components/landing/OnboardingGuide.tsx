import { useState } from 'react'
import { Box, Collapse, Typography, useTheme } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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

const steps = [
  {
    to: '/catalog',
    title: 'Component Types',
    body: 'Define the component types you want to track — chain, tyres, brake pads…',
    light: componentTypesLight,
    dark: componentTypesDark,
  },
  {
    to: '/bikes',
    title: 'Bikes',
    body: "Create your bikes and give each one mount points — the places a component type fits.",
    light: bikesLight,
    dark: bikesDark,
  },
  {
    to: '/components',
    title: 'Components',
    body: "Add your physical components and mount them at a bike's mount points.",
    light: componentsLight,
    dark: componentsDark,
  },
  {
    to: '/assemblies',
    title: 'Assemblies',
    body: 'Group components, e.g. into a wheelset, and mount or swap them as one unit.',
    light: assembliesLight,
    dark: assembliesDark,
  },
  {
    to: '/tourImport',
    title: 'Import Tours',
    body: 'Import tours from a .FIT file or a MyTourbook export.',
    light: tourImportLight,
    dark: tourImportDark,
  },
  {
    to: '/tours',
    title: 'Tours',
    body: 'Inspect the tours you have imported.',
    light: toursLight,
    dark: toursDark,
  },
  {
    to: '/maintenance',
    title: 'Maintenance',
    body: "Set up recurring maintenance tasks per bike and log when they're done.",
    light: maintenanceLight,
    dark: maintenanceDark,
  },
  {
    to: '/report',
    title: 'Report',
    body: 'Inspect usage statistics to plan maintenance.',
    light: reportLight,
    dark: reportDark,
  },
]

export const OnboardingGuide = () => {
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
          Getting started
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
              title={step.title}
              body={step.body}
              to={step.to}
              imgSrc={isDark ? step.dark : step.light}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
