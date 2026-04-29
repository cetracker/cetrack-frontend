import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
  type DialogProps,
} from '@mui/material'
import { type FormEvent, type ReactNode } from 'react'

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
}: FormDialogProps) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
   <Dialog
     open={open}
     onClose={submitting ? undefined : onCancel}
     fullWidth
     fullScreen={fullScreen}
     maxWidth={maxWidth}
     slotProps={{
        paper: {
          component: 'form',
          onSubmit: (e: FormEvent) => {
            e.preventDefault()
            onSubmit()
          },
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
}
