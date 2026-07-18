// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AuthStatus } from '@/types/api'
import { useUnlock } from './useUnlock'
import { UnlockProvider } from './UnlockProvider'

vi.mock('@/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/auth')>()
  return { ...actual, authStatusQuery: vi.fn(), unlock: vi.fn() }
})

import { authStatusQuery, unlock, getStoredUnlockToken, clearStoredUnlockToken } from '@/api/auth'

const mockAuthStatus = (status: AuthStatus) => {
  vi.mocked(authStatusQuery).mockReturnValue({
    queryKey: ['auth', 'status'],
    queryFn: async () => status,
  })
}

const Consumer = () => {
  const { gateEnabled, unlocked, requestUnlock } = useUnlock()
  return (
    <div>
      <span data-testid="gateEnabled">{String(gateEnabled)}</span>
      <span data-testid="unlocked">{String(unlocked)}</span>
      <button onClick={() => requestUnlock()}>trigger unlock</button>
    </div>
  )
}

const renderWithProvider = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <UnlockProvider>
        <Consumer />
      </UnlockProvider>
    </QueryClientProvider>,
  )
}

describe('useUnlock', () => {
  it('throws when used outside UnlockProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Consumer />)).toThrow('useUnlock must be used within UnlockProvider')
    consoleError.mockRestore()
  })
})

describe('UnlockProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearStoredUnlockToken()
  })

  it('reflects the gate status from authStatusQuery and starts locked with no stored token', async () => {
    mockAuthStatus({ enabled: true })
    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('gateEnabled')).toHaveTextContent('true'))
    expect(screen.getByTestId('unlocked')).toHaveTextContent('false')
  })

  it('unlocks via the keypad, persists the token, and resolves requestUnlock', async () => {
    const user = userEvent.setup()
    mockAuthStatus({ enabled: true })
    vi.mocked(unlock).mockResolvedValue({ token: 'tok-abc', expiresAt: '2030-01-01T00:00:00Z' })
    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('gateEnabled')).toHaveTextContent('true'))
    await user.click(screen.getByRole('button', { name: 'trigger unlock' }))

    // the keypad dialog opened as a result of requestUnlock()
    expect(await screen.findByText('Enter edit PIN')).toBeInTheDocument()

    for (const digit of '123456') {
      await user.click(screen.getByRole('button', { name: digit }))
    }

    await waitFor(() => expect(screen.getByTestId('unlocked')).toHaveTextContent('true'))
    expect(getStoredUnlockToken()).toBe('tok-abc')
  })
})
