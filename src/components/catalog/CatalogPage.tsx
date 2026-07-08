import { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ComponentTypeList } from './ComponentTypeList'
import { PositionList } from './PositionList'

export const CatalogPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <Box sx={{ typography: 'h5', mb: 2 }}>{t('catalog.page.title')}</Box>
      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={t('catalog.page.componentTypesTab')} />
        <Tab label={t('catalog.page.positionsTab')} />
      </Tabs>
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        {tab === 0 ? <ComponentTypeList /> : <PositionList />}
      </Box>
    </Box>
  )
}
