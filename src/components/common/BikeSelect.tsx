import { MenuItem, TextField, type TextFieldProps } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { bikesQuery } from '@/api/bikes'
import { bikeName } from '@/utils/formatters'

type Props = Omit<TextFieldProps, 'onChange' | 'value' | 'select'> & {
  value: string | null | undefined
  onChange: (id: string | null) => void
  includeNone?: boolean
  noneLabel?: string
}

export const BikeSelect = ({
  value,
  onChange,
  includeNone = true,
  noneLabel = '— None —',
  label = 'Bike',
  ...rest
}: Props) => {
  const { data: bikes, isLoading } = useQuery(bikesQuery())

  return (
    <TextField
      select
      label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={isLoading || rest.disabled}
      fullWidth
      {...rest}
    >
      {includeNone && <MenuItem value="">{noneLabel}</MenuItem>}
      {(bikes ?? []).map((b) => (
        <MenuItem key={b.id} value={b.id}>
          {bikeName(b)}
        </MenuItem>
      ))}
    </TextField>
  )
}
