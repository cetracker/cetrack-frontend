import { IconButton, Stack, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LinkIcon from '@mui/icons-material/Link'
import type { MouseEvent, ReactNode } from 'react'

interface RowActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  onOpenRelations?: () => void
  editLabel?: string
  deleteLabel?: string
  relationsLabel?: string
  extra?: ReactNode
}

const stop = (fn?: () => void) => (e: MouseEvent) => {
  e.stopPropagation()
  fn?.()
}

export const RowActions = ({
  onEdit,
  onDelete,
  onOpenRelations,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  relationsLabel = 'Show relations',
  extra,
}: RowActionsProps) => (
  <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
    {onOpenRelations && (
      <Tooltip title={relationsLabel}>
        <IconButton size="small" onClick={stop(onOpenRelations)}>
          <LinkIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {onEdit && (
      <Tooltip title={editLabel}>
        <IconButton size="small" onClick={stop(onEdit)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {onDelete && (
      <Tooltip title={deleteLabel}>
        <IconButton size="small" onClick={stop(onDelete)} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
    {extra}
  </Stack>
)
