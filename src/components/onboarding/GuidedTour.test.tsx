// @vitest-environment jsdom
import { useEffect } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { lightTheme } from '@/theme'
import { OnboardingProvider } from '@/App'
import { useOnboarding } from '@/hooks/useOnboarding'
import { GuidedTour } from './GuidedTour'

const NAV_KEYS = ['bikes', 'componentTypes', 'components', 'tourImport', 'tours', 'report']

const StartTour = () => {
  const { startTour } = useOnboarding()
  useEffect(() => {
    startTour()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

const renderTour = () =>
  render(
    <ThemeProvider theme={lightTheme}>
      <OnboardingProvider>
        {NAV_KEYS.map((key) => (
          <div key={key} data-tour={key} />
        ))}
        <StartTour />
        <GuidedTour />
      </OnboardingProvider>
    </ThemeProvider>,
  )

beforeEach(() => localStorage.clear())

describe('GuidedTour', () => {
  it('starts on the first step with 6 progress dots and no Back button', () => {
    renderTour()

    expect(screen.getByText('Bikes')).toBeInTheDocument()
    expect(screen.getAllByTestId('tour-progress-dot')).toHaveLength(6)
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('advances with Next and shows Back once past the first step', async () => {
    renderTour()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Component Types')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Bikes')).toBeInTheDocument()
  })

  it('clamps at the last step, showing Finish instead of Next', async () => {
    renderTour()
    const user = userEvent.setup()

    for (let i = 0; i < NAV_KEYS.length - 1; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }

    expect(screen.getByText('Report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
  })

  it('Skip closes the tour and persists the onboarded flag', async () => {
    renderTour()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(screen.queryByText('Bikes')).not.toBeInTheDocument()
    expect(localStorage.getItem('cetrack:onboarded')).toBe('true')
  })

  it('Escape closes the tour and persists the onboarded flag', () => {
    renderTour()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('Bikes')).not.toBeInTheDocument()
    expect(localStorage.getItem('cetrack:onboarded')).toBe('true')
  })

  it('Finish on the last step closes the tour and persists the onboarded flag', async () => {
    renderTour()
    const user = userEvent.setup()

    for (let i = 0; i < NAV_KEYS.length - 1; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }
    await user.click(screen.getByRole('button', { name: 'Finish' }))

    expect(screen.queryByText('Report')).not.toBeInTheDocument()
    expect(localStorage.getItem('cetrack:onboarded')).toBe('true')
  })
})
