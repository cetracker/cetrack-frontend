// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NavList } from './NavList'

afterEach(() => {
  localStorage.removeItem('cetrack:lang')
  void i18n.changeLanguage('en')
})

describe('LanguageSwitcher', () => {
  it('flips the language, persists it, and re-renders translated labels', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LanguageSwitcher />
        <NavList />
      </MemoryRouter>,
    )

    expect(screen.getByText('Bikes')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Language' }))
    await user.click(screen.getByRole('menuitem', { name: 'Deutsch' }))

    expect(await screen.findByText('Fahrräder')).toBeInTheDocument()
    expect(localStorage.getItem('cetrack:lang')).toBe('de')
  })
})
