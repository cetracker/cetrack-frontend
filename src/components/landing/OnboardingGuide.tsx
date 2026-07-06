import { useState } from 'react'
import { Box, Collapse, Typography, useTheme } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { StepCard } from './StepCard'
import bikeLight from '@/assets/landing/1_bike_light.png'
import bikeDark from '@/assets/landing/1_bike_dark.png'
import partTypesLight from '@/assets/landing/2_partTypes_light.png'
import partTypesDark from '@/assets/landing/2_partTypes_dark.png'
import partsLight from '@/assets/landing/3_parts_light.png'
import partsDark from '@/assets/landing/3_parts_dark.png'
import importLight from '@/assets/landing/4_tour_import_light.png'
import importDark from '@/assets/landing/4_tour_import_dark.png'
import toursLight from '@/assets/landing/5_tours_light.png'
import toursDark from '@/assets/landing/5_tours_dark.png'
import reportLight from '@/assets/landing/6_report_light.png'
import reportDark from '@/assets/landing/6_report_dark.png'

const steps = [
  { to: '/bikes', title: 'Bikes', body: 'Create one or more bikes.', light: bikeLight, dark: bikeDark },
  {
    to: '/catalog',
    title: 'Component Types',
    body: 'Define the component types each bike needs.',
    light: partTypesLight,
    dark: partTypesDark,
  },
  {
    to: '/components',
    title: 'Components',
    body: 'Add your physical components and mount them to a bike.',
    light: partsLight,
    dark: partsDark,
  },
  {
    to: '/tourImport',
    title: 'Import Tours',
    body: 'Import tours from a .FIT file or a MyTourbook export.',
    light: importLight,
    dark: importDark,
  },
  {
    to: '/tours',
    title: 'Tours',
    body: 'Inspect the tours you have imported.',
    light: toursLight,
    dark: toursDark,
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
