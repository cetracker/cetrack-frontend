// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnlockContext, type UnlockApi } from '@/hooks/useUnlock'
import { LockIndicator } from './LockIndicator'

const renderIndicator = (api: UnlockApi) =>
  render(
    <UnlockContext.Provider value={api}>
      <LockIndicator />
    </UnlockContext.Provider>,
  )

describe('LockIndicator', () => {
  it('renders nothing when the gate is disabled', () => {
    renderIndicator({ gateEnabled: false, unlocked: false, requestUnlock: vi.fn() })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the locked icon and triggers requestUnlock on click when locked', async () => {
    const user = userEvent.setup()
    const requestUnlock = vi.fn().mockResolvedValue(undefined)
    renderIndicator({ gateEnabled: true, unlocked: false, requestUnlock })

    const button = screen.getByRole('button', { name: /editing is locked/i })
    await user.click(button)

    expect(requestUnlock).toHaveBeenCalledTimes(1)
  })

  it('shows the unlocked icon and does not prompt again when already unlocked', async () => {
    const user = userEvent.setup()
    const requestUnlock = vi.fn()
    renderIndicator({ gateEnabled: true, unlocked: true, requestUnlock })

    const button = screen.getByRole('button', { name: /editing is unlocked/i })
    await user.click(button)

    expect(requestUnlock).not.toHaveBeenCalled()
  })
})
