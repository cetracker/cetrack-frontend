import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  type DialogProps,
} from '@mui/material'
import type { ReactNode } from 'react'

interface FormDialogProps {
  open: boolean
  title: ReactNode
  onCancel: () => void
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  submitting?: boolean
  submitDisabled?: boolean
  children: ReactNode
  maxWidth?: DialogProps['maxWidth']
}

export const FormDialog = ({
  open,
  title,
  onCancel,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitting,
  submitDisabled,
  children,
  maxWidth = 'sm',
}: FormDialogProps) => (
  <Dialog
    open={open}
    onClose={submitting ? undefined : onCancel}
    fullWidth
    maxWidth={maxWidth}
    disableEscapeKeyDown={submitting}
    PaperProps={{
      component: 'form',
      onSubmit: (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit()
      },
    }}
  >
    <DialogTitle>{title}</DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={submitting}>
        {cancelLabel}
      </Button>
      <Button type="submit" variant="contained" disabled={submitting || submitDisabled}>
        {submitLabel}
      </Button>
    </DialogActions>
  </Dialog>
)
