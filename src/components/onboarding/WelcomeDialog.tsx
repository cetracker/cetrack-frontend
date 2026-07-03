import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

interface WelcomeDialogProps {
  open: boolean
  onTakeTour: () => void
  onDismiss: () => void
}

export const WelcomeDialog = ({ open, onTakeTour, onDismiss }: WelcomeDialogProps) => (
  <Dialog open={open} onClose={onDismiss} aria-labelledby="welcome-title">
    <DialogTitle id="welcome-title">Welcome to CETracker 👋</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Want a quick tour of how to track your bikes, parts, and rides?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onDismiss}>I'll explore</Button>
      <Button variant="contained" onClick={onTakeTour}>
        Show me
      </Button>
    </DialogActions>
  </Dialog>
)
