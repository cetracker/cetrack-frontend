import { useState } from 'react'
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '@/hooks/useDateFormat'
import type { FormatProfile } from '@/i18n/formatProfile'

const PROFILES: { value: FormatProfile; label: string }[] = [
  { value: 'iso', label: 'ISO' },
  { value: 'de', label: 'Deutsch' },
  { value: 'us', label: 'English (US)' },
]

export const FormatSwitcher = () => {
  const { t } = useTranslation()
  const { format, setFormat } = useDateFormat()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      <Tooltip title={t('appShell.dateFormat')}>
        <IconButton
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t('appShell.dateFormat')}
        >
          <CalendarMonthIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {PROFILES.map(({ value, label }) => (
          <MenuItem
            key={value}
            selected={format === value}
            onClick={() => {
              setFormat(value)
              setAnchorEl(null)
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
