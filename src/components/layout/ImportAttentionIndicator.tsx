import { Badge, IconButton, Tooltip } from '@mui/material'
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { pendingMyTourbookSessionQuery } from '@/api/tours'

export const ImportAttentionIndicator = () => {
  const { t } = useTranslation()
  const { data: session } = useQuery(pendingMyTourbookSessionQuery())
  if (!session || (session.candidates.length === 0 && session.warnings.length === 0)) return null

  const count = session.candidates.length
  const hasLogicalDuplicate = session.warnings.some((w) => w.type === 'LOGICAL_DUPLICATE')

  if (hasLogicalDuplicate) {
    return (
      <Tooltip title={t('appShell.importAttentionTooltip')}>
        <IconButton
          color="inherit"
          component={RouterLink}
          to="/mytourbookImport"
          aria-label={t('appShell.reviewImport')}
        >
          <Badge badgeContent={count} color="error">
            <NotificationImportantIcon color="error" />
          </Badge>
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={t('appShell.importPendingTooltip')}>
      <IconButton
        color="inherit"
        component={RouterLink}
        to="/mytourbookImport"
        aria-label={t('appShell.reviewImport')}
      >
        <Badge badgeContent={count} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  )
}
