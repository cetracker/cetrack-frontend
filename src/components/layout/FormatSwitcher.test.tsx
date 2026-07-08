// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatDate } from '@/utils/formatters'
import { DateFormatContext } from '@/hooks/useDateFormat'
import { setFormatProfile, type FormatProfile } from '@/i18n/formatProfile'
import { FormatSwitcher } from './FormatSwitcher'

afterEach(() => {
  localStorage.removeItem('cetrack:dateFormat')
  setFormatProfile('iso')
})

const Harness = () => {
  const [format, setFormat] = useState<FormatProfile>('iso')
  return (
    <DateFormatContext.Provider
      value={{
        format,
        setFormat: (next) => {
          setFormatProfile(next)
          localStorage.setItem('cetrack:dateFormat', next)
          setFormat(next)
        },
      }}
    >
      <FormatSwitcher />
      <span data-testid="date">{formatDate('2026-01-15')}</span>
    </DateFormatContext.Provider>
  )
}

describe('FormatSwitcher', () => {
  it('flips the format profile, persists it, and re-renders a formatted date', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByTestId('date')).toHaveTextContent('2026-01-15')

    await user.click(screen.getByRole('button', { name: 'Date & number format' }))
    await user.click(screen.getByRole('menuitem', { name: 'Deutsch' }))

    expect(await screen.findByTestId('date')).toHaveTextContent('15.01.2026')
    expect(localStorage.getItem('cetrack:dateFormat')).toBe('de')
  })
})
