import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import CachedIcon from '@mui/icons-material/Cached'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { componentsQuery } from '@/api/components'
import type { AssemblyMembership } from '@/types/api'
import { componentIdentity, formatDateTime } from '@/utils/formatters'

interface MembershipHistoryTableProps {
  memberships: AssemblyMembership[]
  onReuse?: (componentId: string) => void
  reuseComponentIds?: string[]
}

export const MembershipHistoryTable = ({
  memberships,
  onReuse,
  reuseComponentIds,
}: MembershipHistoryTableProps) => {
  const { t } = useTranslation()
  const { data: components } = useQuery(componentsQuery())

  const componentMap = new Map((components ?? []).map((c) => [c.id, c]))

  const sorted = memberships.slice().sort((a, b) => b.memberFrom.localeCompare(a.memberFrom))

  const reuseIdSet = new Set(reuseComponentIds ?? [])
  const seenComponentIds = new Set<string>()

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
              <TableCell>{componentIdentity(componentMap.get(m.componentId))}</TableCell>
              <TableCell>{formatDateTime(m.memberFrom)}</TableCell>
              <TableCell>
                {m.memberTo ? (
                  formatDateTime(m.memberTo)
                ) : (
                  <Chip label={t('mountings.history.activeChip')} color="success" size="small" />
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
