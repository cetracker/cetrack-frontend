// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { MemoryRouter } from 'react-router-dom'
import { lightTheme } from '@/theme'
import { OnboardingProvider } from '@/App'
import { Index } from './Index'

const renderIndex = () =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={lightTheme}>
        <OnboardingProvider>
          <Index />
        </OnboardingProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )

beforeEach(() => localStorage.clear())

describe('Index', () => {
  it('shows the 6-step getting-started guide and a welcome dialog on first visit', () => {
    renderIndex()

    // Cards render behind the modal; the open dialog aria-hides the app, so query card
    // text rather than roles here.
    expect(screen.getByText('Bikes')).toBeInTheDocument()
    expect(screen.getByText('Import Tours')).toBeInTheDocument()
    expect(screen.getByText('Report')).toBeInTheDocument()
    expect(screen.getByText(/\.FIT file or a MyTourbook export/i)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent(/Welcome to CETracker/i)
  })

  it('keeps the getting-started cards but shows no welcome dialog once onboarded', () => {
    localStorage.setItem('cetrack:onboarded', 'true')
    renderIndex()

    expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument()
    expect(screen.getByText('Bikes')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('folds the getting-started cards away when the header is toggled', async () => {
    localStorage.setItem('cetrack:onboarded', 'true')
    renderIndex()
    const user = userEvent.setup()

    const toggle = screen.getByRole('button', { name: /getting started/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('dismissing the welcome dialog persists the onboarded flag and reveals the cards', async () => {
    renderIndex()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /explore/i }))

    // Once the modal closes the app is no longer aria-hidden, so the heading becomes queryable.
    await screen.findByRole('heading', { name: 'Getting started' })
    expect(localStorage.getItem('cetrack:onboarded')).toBe('true')
  })
})
