import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTranslation } from 'react-i18next'
import type { Component } from '@/types/api'
import { componentDisambiguator, componentIdentity, formatDate } from '@/utils/formatters'
import { retirementKindLabel } from '@/utils/retirement'

export const ComponentInfoCell = ({ component }: { component: Component }) => {
  const { t } = useTranslation()
  const price = component.price
    ? `${component.price} ${component.priceCurrency ?? ''}`.trim()
    : ''
  const details: [string, string][] = (
    [
      [t('common.manufacturer'), component.manufacturer ?? ''],
      [t('common.model'), component.model ?? ''],
      [t('components.fields.serial'), component.serialNumber ?? ''],
      [t('components.fields.vendor'), component.vendor ?? ''],
      [t('components.fields.price'), price],
      [t('components.fields.purchased'), formatDate(component.purchaseDate)],
      [t('components.fields.retired'), formatDate(component.retiredAt)],
      [
        t('retirement.reasonLabel'),
        component.retirementKind ? retirementKindLabel(component.retirementKind) : '',
      ],
      [t('retirement.noteLabel'), component.retirementNote ?? ''],
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
            aria-label={t('components.infoCell.detailsAriaLabel')}
            onClick={(e) => e.stopPropagation()}
          >
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  )
}
