import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Component } from '@/types/api'
import { componentDisambiguator, componentIdentity, formatDate } from '@/utils/formatters'

export const ComponentInfoCell = ({ component }: { component: Component }) => {
  const price = component.price
    ? `${component.price} ${component.priceCurrency ?? ''}`.trim()
    : ''
  const details: [string, string][] = (
    [
      ['Manufacturer', component.manufacturer ?? ''],
      ['Model', component.model ?? ''],
      ['Serial', component.serialNumber ?? ''],
      ['Vendor', component.vendor ?? ''],
      ['Price', price],
      ['Purchased', formatDate(component.purchaseDate)],
      ['Retired', formatDate(component.retiredAt)],
    ] as [string, string][]
  ).filter(([, v]) => v)

  const disambig = componentDisambiguator(component)

  return (
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
      <Stack>
        <span>{componentIdentity(component)}</span>
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
            aria-label="Component details"
            onClick={(e) => e.stopPropagation()}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}
