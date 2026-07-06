import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { componentTypesQuery } from '@/api/catalog'
import type { Assembly } from '@/types/api'
import { formatDateTime } from '@/utils/formatters'

interface AssemblySlotsTableProps {
  assembly: Assembly
}

export const AssemblySlotsTable = ({ assembly }: AssemblySlotsTableProps) => {
  const { data: componentTypes } = useQuery(componentTypesQuery())
  const typeNameById = new Map((componentTypes ?? []).map((t) => [t.id, t.name]))

  if (assembly.slots.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No slots yet.
      </Typography>
    )
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Slot</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Valid from</TableCell>
          <TableCell>Valid to</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {assembly.slots.map((slot) => (
          <TableRow key={slot.id}>
            <TableCell>{slot.name}</TableCell>
            <TableCell>{typeNameById.get(slot.componentTypeId) ?? ''}</TableCell>
            <TableCell>{formatDateTime(slot.validFrom)}</TableCell>
            <TableCell>{slot.validTo ? formatDateTime(slot.validTo) : ''}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
