import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { ComponentTypeList } from './ComponentTypeList'
import { PositionList } from './PositionList'

export const CatalogPage = () => {
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Box sx={{ typography: 'h5', mb: 2 }}>Catalog</Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Component Types" />
        <Tab label="Positions" />
      </Tabs>
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        {tab === 0 ? <ComponentTypeList /> : <PositionList />}
      </Box>
    </Box>
  )
}
