import { Box, Tooltip, Typography } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useQuery } from '@tanstack/react-query'
import { backendInfoQuery } from '@/api/info'
import { formatDateTime } from '@/utils/formatters'

export const VersionInfo = () => {
  const { data: backendInfo, isError } = useQuery(backendInfoQuery())

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Tooltip title={`Built ${formatDateTime(__BUILD_TIME__)}`}>
        <Typography variant="caption" color="text.secondary" component="div">
          Frontend v{__APP_VERSION__}
        </Typography>
      </Tooltip>
      {isError ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WarningAmberIcon color="warning" sx={{ fontSize: 14 }} />
          <Typography variant="caption" color="text.secondary">
            Backend unreachable
          </Typography>
        </Box>
      ) : (
        <Tooltip title={backendInfo ? `Built ${formatDateTime(backendInfo.buildTime)}` : ''}>
          <Typography variant="caption" color="text.secondary" component="div">
            Backend v{backendInfo?.version ?? '…'}
          </Typography>
        </Tooltip>
      )}
    </Box>
  )
}
