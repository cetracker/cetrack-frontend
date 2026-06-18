import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { ReportItem } from '@/types/api'
import { partIdentity } from '@/utils/formatters'

export const ReportItemInfoCell = ({ item }: { item: ReportItem }) => {
  const details: [string, string][] = (
    [
      ['Manufacturer', item.manufacturer ?? ''],
      ['Model', item.model ?? ''],
      ['Serial', item.serialNumber ?? ''],
    ] as [string, string][]
  ).filter(([, v]) => v)

  const hasLabel = !!item.label?.trim()

  return (
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
      <span>{partIdentity(item)}</span>
      {hasLabel && details.length > 0 && (
        <Tooltip
          title={
            <Box sx={{ p: 0.5 }}>
              {details.map(([k, v]) => (
                <Stack
                  key={k}
                  sx={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {k}
                  </Typography>
                  <Typography variant="caption">{v}</Typography>
                </Stack>
              ))}
            </Box>
          }
          placement="right"
          enterTouchDelay={0}
          leaveTouchDelay={2000}
          slotProps={{
            tooltip: {
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 3,
                minWidth: 200,
                p: 1,
              },
            },
          }}
        >
          <IconButton
            size="small"
            aria-label="Part details"
            onClick={(e) => e.stopPropagation()}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}
