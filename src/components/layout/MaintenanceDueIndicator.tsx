import { Badge, IconButton, Tooltip } from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { maintenanceTasksQuery } from '@/api/maintenance'

const POLL_MS = 30 * 60_000

export const MaintenanceDueIndicator = () => {
  const { t } = useTranslation()
  const { data } = useQuery({
    ...maintenanceTasksQuery({ due: true }),
    refetchInterval: POLL_MS,
  })

  const count = data?.length ?? 0
  if (count === 0) return null

  return (
    <Tooltip title={t('appShell.maintenanceDueTooltip', { count })}>
      <IconButton
        color="inherit"
        component={RouterLink}
        to="/maintenance?due=1"
        aria-label={t('appShell.reviewMaintenance')}
      >
        <Badge badgeContent={count} color="error">
          <BuildIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  )
}
