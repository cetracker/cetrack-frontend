import { useState } from 'react'
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/hooks/useLanguage'
import type { AppLanguage } from '@/i18n'

const LANGUAGES: { value: AppLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
]

export const LanguageSwitcher = () => {
  const { t } = useTranslation()
  const { lang, setLang } = useLanguage()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      <Tooltip title={t('appShell.language')}>
        <IconButton
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={t('appShell.language')}
        >
          <TranslateIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {LANGUAGES.map(({ value, label }) => (
          <MenuItem
            key={value}
            selected={lang === value}
            onClick={() => {
              setLang(value)
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
