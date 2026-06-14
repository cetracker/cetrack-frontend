import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Part } from '@/types/api'
import { formatDate, partDisambiguator, partIdentity } from '@/utils/formatters'

export const PartInfoCell = ({ part }: { part: Part }) => {
  const price = part.purchasePrice
    ? `${part.purchasePrice} ${part.purchasePriceCurrency ?? ''}`.trim()
    : ''
  const details: [string, string][] = (
    [
      ['Manufacturer', part.manufacturer ?? ''],
      ['Model', part.model ?? ''],
      ['Serial', part.serialNumber ?? ''],
      ['Vendor', part.vendor ?? ''],
      ['Price', price],
      ['First used', formatDate(part.firstUsedDate)],
      ['Bought', formatDate(part.boughtAt)],
      ['Retired', formatDate(part.retiredAt)],
    ] as [string, string][]
  ).filter(([, v]) => v)

  const disambig = partDisambiguator(part)

  return (
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
      <Stack>
        <span>{partIdentity(part)}</span>
        {disambig && (
          <Typography variant="caption" color="text.secondary">
            {disambig}
          </Typography>
        )}
      </Stack>
      {details.length > 0 && (
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
