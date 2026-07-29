import { Box, Button, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { useTranslation } from 'react-i18next'

export const NotFound = () => {
  const { t } = useTranslation()
  return (
    <Box sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h3" gutterBottom>
        {t('notFound.title')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {t('notFound.message')}
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        {t('notFound.backHome')}
      </Button>
    </Box>
  )
}
