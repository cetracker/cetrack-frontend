import { Box, Button, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export const NotFound = () => (
  <Box sx={{ textAlign: 'center', mt: 6 }}>
    <Typography variant="h3" gutterBottom>
      404
    </Typography>
    <Typography variant="body1" sx={{ mb: 3 }}>
      The page you were looking for doesn&apos;t exist.
    </Typography>
    <Button component={RouterLink} to="/" variant="contained">
      Back home
    </Button>
  </Box>
)
