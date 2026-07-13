import {
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import CachedIcon from '@mui/icons-material/Cached'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { componentsQuery } from '@/api/components'
import { ComponentInfoCell } from '@/components/components/ComponentInfoCell'
import type { AssemblyMembership } from '@/types/api'
import { componentIdentity, formatDateTime } from '@/utils/formatters'

interface MembershipHistoryTableProps {
  memberships: AssemblyMembership[]
  onReuse?: (componentId: string) => void
  reuseComponentIds?: string[]
  onCorrect?: (membership: AssemblyMembership) => void
  onVoid?: (membership: AssemblyMembership) => void
}

export const MembershipHistoryTable = ({
  memberships,
  onReuse,
  reuseComponentIds,
  onCorrect,
  onVoid,
}: MembershipHistoryTableProps) => {
  const { t } = useTranslation()
  const { data: components } = useQuery(componentsQuery())

  const componentMap = new Map((components ?? []).map((c) => [c.id, c]))

  const sorted = memberships.slice().sort((a, b) => b.memberFrom.localeCompare(a.memberFrom))

  const reuseIdSet = new Set(reuseComponentIds ?? [])
  const seenComponentIds = new Set<string>()
  const showActions = !!onCorrect || !!onVoid

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        {t('assemblies.membershipHistory.empty')}
      </Typography>
    )
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {onReuse && <TableCell />}
          <TableCell>{t('components.list.columns.component')}</TableCell>
          <TableCell>{t('assemblies.membershipHistory.fromHeader')}</TableCell>
          <TableCell>{t('assemblies.membershipHistory.toHeader')}</TableCell>
          {showActions && <TableCell align="right" />}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((m) => {
          const showReuse =
            !!onReuse && !seenComponentIds.has(m.componentId) && reuseIdSet.has(m.componentId)
          seenComponentIds.add(m.componentId)
          return (
            <TableRow key={m.id}>
              {onReuse && (
                <TableCell>
                  {showReuse && (
                    <Tooltip title={t('mountings.history.reuseTooltip')}>
                      <IconButton size="small" onClick={() => onReuse(m.componentId)}>
                        <CachedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              )}
              <TableCell>
                {(() => {
                  const component = componentMap.get(m.componentId)
                  return component ? (
                    <ComponentInfoCell component={component} />
                  ) : (
                    componentIdentity(component)
                  )
                })()}
              </TableCell>
              <TableCell>{formatDateTime(m.memberFrom)}</TableCell>
              <TableCell>
                {m.memberTo ? (
                  formatDateTime(m.memberTo)
                ) : (
                  <Chip label={t('mountings.history.activeChip')} color="success" size="small" />
                )}
              </TableCell>
              {showActions && (
                <TableCell align="right">
                  <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    {onCorrect && (
                      <Tooltip title={t('assemblies.membershipHistory.correctTooltip')}>
                        <IconButton size="small" onClick={() => onCorrect(m)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onVoid && (
                      <Tooltip
                        title={
                          m.memberTo
                            ? t('assemblies.membershipHistory.voidTooltip')
                            : t('assemblies.membershipHistory.activeVoidBlockedTooltip')
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={!m.memberTo}
                            onClick={() => onVoid(m)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
