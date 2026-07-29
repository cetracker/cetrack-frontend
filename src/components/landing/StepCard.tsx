import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { useTranslation } from 'react-i18next'

interface StepCardProps {
  step: number
  title: string
  body: ReactNode
  to: string
  imgSrc: string
}

export const StepCard = ({ step, title, body, to, imgSrc }: StepCardProps) => {
  const { t } = useTranslation()
  return (
  <Paper
    component={RouterLink}
    to={to}
    elevation={1}
    sx={{
      p: 2,
      display: 'block',
      textDecoration: 'none',
      color: 'text.primary',
      transition: 'transform 0.25s, box-shadow 0.25s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
    }}
  >
    <Box
      component="img"
      src={imgSrc}
      alt=""
      sx={{ width: '100%', display: 'block', borderRadius: 1, mb: 1 }}
    />
    <Typography variant="overline" color="text.secondary">
      {t('landing.stepCard.stepLabel', { number: step })}
    </Typography>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {body}
    </Typography>
  </Paper>
  )
}
