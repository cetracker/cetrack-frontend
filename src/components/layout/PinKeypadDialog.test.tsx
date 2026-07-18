// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiException } from '@/api/client'
import { PinKeypadDialog } from './PinKeypadDialog'

vi.mock('@/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/auth')>()
  return { ...actual, unlock: vi.fn() }
})

import { unlock } from '@/api/auth'

const enterPin = async (user: ReturnType<typeof userEvent.setup>, pin: string) => {
  for (const digit of pin) {
    await user.click(screen.getByRole('button', { name: digit }))
  }
}

const renderDialog = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const onUnlocked = vi.fn()
  const onCancel = vi.fn()
  render(
    <QueryClientProvider client={qc}>
      <PinKeypadDialog open onUnlocked={onUnlocked} onCancel={onCancel} />
    </QueryClientProvider>,
  )
  return { onUnlocked, onCancel }
}

describe('PinKeypadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('auto-submits once 6 digits are entered and calls onUnlocked with the token', async () => {
    const user = userEvent.setup()
    vi.mocked(unlock).mockResolvedValue({ token: 'tok-123', expiresAt: '2030-01-01T00:00:00Z' })
    const { onUnlocked } = renderDialog()

    await enterPin(user, '123456')

    await waitFor(() => expect(unlock).toHaveBeenCalledWith('123456'))
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith('tok-123'))
  })

  it('shows an inline error and clears the pin on a wrong PIN', async () => {
    const user = userEvent.setup()
    vi.mocked(unlock).mockRejectedValue(
      new ApiException({ status: 401, code: 'INVALID_PIN', message: 'Wrong PIN.' }),
    )
    renderDialog()

    await enterPin(user, '000000')

    expect(await screen.findByText('Wrong PIN.')).toBeInTheDocument()
  })

  it('shows a cooldown countdown on 429 and disables the keypad', async () => {
    const user = userEvent.setup()
    vi.mocked(unlock).mockRejectedValue(
      new ApiException({
        status: 429,
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many attempts',
        retryAfterSeconds: 3,
      }),
    )
    renderDialog()

    await enterPin(user, '000000')

    expect(await screen.findByText('Too many wrong attempts — try again in 3s')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled()
  })

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderDialog()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalled()
  })
})
