import { Box, Paper, Typography } from '@mui/material'

export const Index = () => (
  <Box sx={{ maxWidth: 720 }}>
    <Typography variant="h4" gutterBottom>
      Cycling Equipment Usage Tracker
    </Typography>
    <Paper sx={{ p: 3 }} elevation={1}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Track parts, bikes, and tours to monitor equipment wear and plan maintenance.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>
        Getting started
      </Typography>
      <Box component="ol" sx={{ pl: 3, '& li': { mb: 1 } }}>
        <li>Create one or more bikes (Bikes page).</li>
        <li>Define the part types each bike needs (Part Types page).</li>
        <li>Add your physical parts (Parts page).</li>
        <li>Relate a part to a part type using the 🔗 icon on the Parts list.</li>
        <li>Import tours from MyTourBook (Import Tours page).</li>
        <li>Inspect usage statistics on the Report page.</li>
      </Box>
    </Paper>
  </Box>
)
