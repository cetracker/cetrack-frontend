import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
} from '@mui/material'
import BackspaceIcon from '@mui/icons-material/Backspace'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { unlock } from '@/api/auth'
import { isApiError } from '@/api/client'
import { friendlyErrorMessage } from '@/utils/errors'

const PIN_LENGTH = 6
const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

interface PinKeypadDialogProps {
  open: boolean
  onUnlocked: (token: string) => void
  onCancel: () => void
}

export const PinKeypadDialog = ({ open, onUnlocked, onCancel }: PinKeypadDialogProps) => {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')
  const [cooldown, setCooldown] = useState<number | null>(null)

  // Reset local state on close, computed during render (not in an effect) per
  // React's guidance for adjusting state on a prop change without a remount.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setPin('')
      setCooldown(null)
    }
  }

  useEffect(() => {
    if (cooldown === null || cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => (s !== null ? s - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const unlockMut = useMutation({
    mutationFn: () => unlock(pin),
    onSuccess: (res) => onUnlocked(res.token),
    onError: (err) => {
      setPin('')
      if (isApiError(err) && err.retryAfterSeconds) {
        setCooldown(Math.ceil(err.retryAfterSeconds))
      }
    },
  })

  const disabled = unlockMut.isPending || (cooldown !== null && cooldown > 0)

  const appendDigit = (digit: string) => {
    if (disabled) return
    setPin((prev) => (prev.length < PIN_LENGTH ? prev + digit : prev))
  }
  const backspace = () => !disabled && setPin((prev) => prev.slice(0, -1))
  const clearPin = () => !disabled && setPin('')

  useEffect(() => {
    if (pin.length === PIN_LENGTH && !unlockMut.isPending) {
      unlockMut.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) appendDigit(e.key)
      else if (e.key === 'Backspace') backspace()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, disabled])

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{t('unlock.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1, alignItems: 'center' }}>
          <Stack direction="row" spacing={1} aria-label={t('unlock.pinEntered', { count: pin.length })}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: i < pin.length ? 'primary.main' : 'action.disabledBackground',
                }}
              />
            ))}
          </Stack>

          {cooldown !== null && cooldown > 0 ? (
            <Alert severity="warning" sx={{ width: '100%' }}>
              {t('unlock.cooldown', { seconds: cooldown })}
            </Alert>
          ) : (
            unlockMut.isError && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {friendlyErrorMessage(unlockMut.error)}
              </Alert>
            )
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, width: 220 }}>
            {KEYPAD_DIGITS.map((d) => (
              <Button key={d} variant="outlined" size="large" onClick={() => appendDigit(d)} disabled={disabled}>
                {d}
              </Button>
            ))}
            <Button variant="text" onClick={clearPin} disabled={disabled}>
              {t('common.clear')}
            </Button>
            <Button variant="outlined" size="large" onClick={() => appendDigit('0')} disabled={disabled}>
              0
            </Button>
            <IconButton onClick={backspace} disabled={disabled} aria-label={t('unlock.backspace')}>
              <BackspaceIcon />
            </IconButton>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  )
}
