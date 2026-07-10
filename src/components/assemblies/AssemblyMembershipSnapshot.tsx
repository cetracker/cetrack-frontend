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
import { assemblyQuery } from '@/api/assemblies'
import { componentTypesQuery } from '@/api/catalog'
import { componentsQuery } from '@/api/components'
import { ComponentInfoCell } from '@/components/components/ComponentInfoCell'
import { formatDateTime, withLocalOffset } from '@/utils/formatters'

interface AssemblyMembershipSnapshotProps {
  assemblyId: string
}

export const AssemblyMembershipSnapshot = ({ assemblyId }: AssemblyMembershipSnapshotProps) => {
  const { t } = useTranslation()
  const [at, setAt] = useState<Date | null>(new Date())
  const atIso = at ? withLocalOffset(at) : undefined

  const { data: assembly } = useQuery({
    ...assemblyQuery(assemblyId, atIso),
    enabled: !!atIso,
  })
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const { data: components } = useQuery(componentsQuery())

  const typeNameById = new Map((componentTypes ?? []).map((ct) => [ct.id, ct.name]))
  const componentById = new Map((components ?? []).map((c) => [c.id, c]))

  const rows = (assembly?.slots ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Accordion defaultExpanded disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{t('assemblies.membershipSnapshot.title')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack sx={{ mb: 1, alignItems: 'flex-start' }}>
          <DateTimePicker
            label={t('assemblies.membershipSnapshot.atLabel')}
            value={at}
            onChange={setAt}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Stack>

        {at && (
          rows.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              {t('assemblies.membershipSnapshot.empty')}
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('assemblies.slotsTable.slotHeader')}</TableCell>
                  <TableCell>{t('common.type')}</TableCell>
                  <TableCell>{t('assemblies.slotsTable.memberHeader')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((slot) => {
                  const component = slot.memberComponentId
                    ? componentById.get(slot.memberComponentId)
                    : undefined
                  return (
                    <TableRow key={slot.id}>
                      <TableCell>{slot.name}</TableCell>
                      <TableCell>{typeNameById.get(slot.componentTypeId) ?? ''}</TableCell>
                      <TableCell>
                        {component ? (
                          <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <ComponentInfoCell component={component} />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {t('assemblies.membershipSnapshot.sincePrefix', {
                                date: formatDateTime(slot.memberFrom),
                              })}
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
