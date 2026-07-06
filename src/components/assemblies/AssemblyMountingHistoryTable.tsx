import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { assemblyMountingsQuery } from '@/api/assemblies'
import { bikesQuery } from '@/api/bikes'
import { bikeIdentity, formatDateTime } from '@/utils/formatters'

interface AssemblyMountingHistoryTableProps {
  assemblyId: string
}

export const AssemblyMountingHistoryTable = ({
  assemblyId,
}: AssemblyMountingHistoryTableProps) => {
  const { data: mountings } = useQuery(assemblyMountingsQuery(assemblyId))
  const { data: bikes } = useQuery(bikesQuery())

  const bikeMap = new Map((bikes ?? []).map((b) => [b.id, b]))
  const sorted = (mountings ?? []).slice().sort((a, b) => b.mountedAt.localeCompare(a.mountedAt))

  if (sorted.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No mounting history yet.
      </Typography>
    )
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Bike</TableCell>
          <TableCell>Mounted</TableCell>
          <TableCell>Dismounted</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{bikeIdentity(bikeMap.get(m.bikeId))}</TableCell>
            <TableCell>{formatDateTime(m.mountedAt)}</TableCell>
            <TableCell>
              {m.dismountedAt ? (
                formatDateTime(m.dismountedAt)
              ) : (
                <Chip label="active" color="success" size="small" />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
