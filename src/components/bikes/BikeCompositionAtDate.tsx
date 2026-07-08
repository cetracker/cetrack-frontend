import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { mountPointsQuery } from '@/api/bikes'
import { componentTypesQuery, positionsQuery } from '@/api/catalog'
import { componentsQuery } from '@/api/components'
import { mountingsQuery } from '@/api/mountings'
import { ComponentInfoCell } from '@/components/components/ComponentInfoCell'
import { formatDateTime, withLocalOffset } from '@/utils/formatters'

interface BikeCompositionAtDateProps {
  bikeId: string
}

export const BikeCompositionAtDate = ({ bikeId }: BikeCompositionAtDateProps) => {
  const { t } = useTranslation()
  const [at, setAt] = useState<Date | null>(new Date())
  const activeAt = at ? withLocalOffset(at) : undefined

  const { data: mountPoints } = useQuery(mountPointsQuery(bikeId))
  const { data: mountings } = useQuery({
    ...mountingsQuery({ bikeId, activeAt }),
    enabled: !!activeAt,
  })
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const { data: positions } = useQuery(positionsQuery())
  const { data: components } = useQuery(componentsQuery())

  const typeNameById = new Map((componentTypes ?? []).map((ct) => [ct.id, ct.name]))
  const positionNameById = new Map((positions ?? []).map((p) => [p.id, p.name]))
  const componentById = new Map((components ?? []).map((c) => [c.id, c]))

  const rows = (mountPoints ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Accordion defaultExpanded disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{t('bikes.compositionAtDate.title')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
      <Stack sx={{ mb: 1, alignItems: 'flex-start' }}>
        <DateTimePicker
          label={t('bikes.compositionAtDate.atLabel')}
          value={at}
          onChange={setAt}
          slotProps={{ textField: { size: 'small' } }}
        />
      </Stack>

      {at && (
        rows.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            {t('bikes.composition.empty')}
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.type')}</TableCell>
                <TableCell>{t('common.position')}</TableCell>
                <TableCell>{t('components.list.columns.component')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((mp) => {
                const mounting = (mountings ?? []).find((m) => m.mountPointId === mp.id)
                const component = mounting ? componentById.get(mounting.componentId) : undefined
                return (
                  <TableRow key={mp.id}>
                    <TableCell>{mp.name}</TableCell>
                    <TableCell>{typeNameById.get(mp.componentTypeId) ?? ''}</TableCell>
                    <TableCell>{mp.positionId ? positionNameById.get(mp.positionId) ?? '' : ''}</TableCell>
                    <TableCell>
                      {mounting && component ? (
                        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <ComponentInfoCell component={component} />
                          <Typography component="span" variant="caption" color="text.secondary">
                            {t('bikes.composition.sincePrefix', { date: formatDateTime(mounting.mountedAt) })}
                          </Typography>
                        </Stack>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )
      )}
      </AccordionDetails>
    </Accordion>
  )
}
