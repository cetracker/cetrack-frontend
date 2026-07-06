// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Mounting } from '@/types/api'
import { CorrectMountingDialog } from './CorrectMountingDialog'

vi.mock('@/api/mountings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/mountings')>()
  return { ...actual, correctMounting: vi.fn().mockResolvedValue({}) }
})

import * as mountingsApi from '@/api/mountings'

const closedMounting: Mounting = {
  id: 'm1',
  componentId: 'c1',
  mountPointId: 'mp1',
  bikeId: 'b1',
  mountPointName: 'Front tyre',
  mountedAt: '2026-01-01T10:00:00Z',
  dismountedAt: '2026-02-01T10:00:00Z',
}

const renderDialog = (mounting: Mounting | null, onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CorrectMountingDialog open onClose={onClose} mounting={mounting} />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('CorrectMountingDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('re-open sends exactly {dismountedAt: null} with no other keys', async () => {
    const user = userEvent.setup()
    renderDialog(closedMounting)

    await user.click(screen.getByRole('checkbox', { name: /re-open/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mountingsApi.correctMounting).toHaveBeenCalledTimes(1)
    const [id, body] = vi.mocked(mountingsApi.correctMounting).mock.calls[0]
    expect(id).toBe('m1')
    expect(JSON.stringify(body)).toContain('"dismountedAt":null')
    expect('mountedAt' in body).toBe(false)
  })

  it('submitting without touching anything sends an empty body', async () => {
    const user = userEvent.setup()
    renderDialog(closedMounting)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(mountingsApi.correctMounting).toHaveBeenCalledTimes(1)
    const [, body] = vi.mocked(mountingsApi.correctMounting).mock.calls[0]
    expect(body).toEqual({})
  })

  it('does not offer Re-open for an active (open-ended) mounting', () => {
    renderDialog({ ...closedMounting, dismountedAt: undefined })
    expect(screen.queryByRole('checkbox', { name: /re-open/i })).not.toBeInTheDocument()
  })
})
