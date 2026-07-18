import { IconButton, Tooltip } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useTranslation } from 'react-i18next'
import { useUnlock } from '@/hooks/useUnlock'

export const LockIndicator = () => {
  const { t } = useTranslation()
  const { gateEnabled, unlocked, requestUnlock } = useUnlock()

  if (!gateEnabled) return null

  return (
    <Tooltip title={unlocked ? t('unlock.unlockedTooltip') : t('unlock.lockedTooltip')}>
      <IconButton
        color="inherit"
        onClick={() => {
          if (!unlocked) requestUnlock().catch(() => undefined)
        }}
        aria-label={unlocked ? t('unlock.unlockedTooltip') : t('unlock.lockedTooltip')}
      >
        {unlocked ? <LockOpenIcon /> : <LockIcon />}
      </IconButton>
    </Tooltip>
  )
}
