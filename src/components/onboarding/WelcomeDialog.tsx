import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

interface WelcomeDialogProps {
  open: boolean
  onTakeTour: () => void
  onDismiss: () => void
}

export const WelcomeDialog = ({ open, onTakeTour, onDismiss }: WelcomeDialogProps) => {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onDismiss} aria-labelledby="welcome-title">
      <DialogTitle id="welcome-title">{t('onboarding.welcome.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('onboarding.welcome.body')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDismiss}>{t('onboarding.welcome.exploreButton')}</Button>
        <Button variant="contained" onClick={onTakeTour}>
          {t('onboarding.welcome.showMeButton')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
