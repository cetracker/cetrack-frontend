import { MenuItem, TextField, type TextFieldProps } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { bikesQuery } from '@/api/bikes'
import { bikeIdentity } from '@/utils/formatters'

export const FROM_FILE = '__from_file__'

type Props = Omit<TextFieldProps, 'onChange' | 'value' | 'select'> & {
  value: string | null | undefined
  onChange: (id: string | null) => void
  includeNone?: boolean
  noneLabel?: string
  includeFromFile?: boolean
}

export const BikeSelect = ({
  value,
  onChange,
  includeNone = true,
  noneLabel,
  includeFromFile = false,
  label,
  ...rest
}: Props) => {
  const { t } = useTranslation()
  const { data: bikes, isLoading } = useQuery(bikesQuery())

  return (
    <TextField
      select
      label={label ?? t('common.bike')}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={isLoading || rest.disabled}
      fullWidth
      {...rest}
    >
      {includeFromFile && (
        <MenuItem value={FROM_FILE}>{t('common.useBikeFromFile')}</MenuItem>
      )}
      {includeNone && <MenuItem value="">{noneLabel ?? t('common.none')}</MenuItem>}
      {(bikes ?? []).map((b) => (
        <MenuItem key={b.id} value={b.id}>
          {bikeIdentity(b)}
        </MenuItem>
      ))}
    </TextField>
  )
}
