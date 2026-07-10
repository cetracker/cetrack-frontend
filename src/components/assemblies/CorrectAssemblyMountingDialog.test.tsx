// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { AssemblyMounting } from '@/types/api'
import { CorrectAssemblyMountingDialog } from './CorrectAssemblyMountingDialog'

vi.mock('@/api/assemblies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/assemblies')>()
  return { ...actual, correctAssemblyMounting: vi.fn().mockResolvedValue({}) }
})

import * as assembliesApi from '@/api/assemblies'

const closedMounting: AssemblyMounting = {
  id: 'am1',
  assemblyId: 'a1',
  bikeId: 'b1',
  mountedAt: '2026-01-01T10:00:00Z',
  dismountedAt: '2026-02-01T10:00:00Z',
}

const renderDialog = (mounting: AssemblyMounting | null, onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CorrectAssemblyMountingDialog
            open
            onClose={onClose}
            assemblyId="a1"
            mounting={mounting}
          />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('CorrectAssemblyMountingDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('re-open sends exactly {dismountedAt: null} with no other keys', async () => {
    const user = userEvent.setup()
    renderDialog(closedMounting)

    await user.click(screen.getByRole('checkbox', { name: /re-open/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(assembliesApi.correctAssemblyMounting).toHaveBeenCalledTimes(1)
    const [assemblyId, mountingId, body] = vi.mocked(assembliesApi.correctAssemblyMounting).mock
      .calls[0]
    expect(assemblyId).toBe('a1')
    expect(mountingId).toBe('am1')
    expect(JSON.stringify(body)).toContain('"dismountedAt":null')
    expect('mountedAt' in body).toBe(false)
  })

  it('submitting without touching anything sends an empty body', async () => {
    const user = userEvent.setup()
    renderDialog(closedMounting)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(assembliesApi.correctAssemblyMounting).toHaveBeenCalledTimes(1)
    const [, , body] = vi.mocked(assembliesApi.correctAssemblyMounting).mock.calls[0]
    expect(body).toEqual({})
  })

  it('does not offer Re-open for an active (open-ended) assembly mounting', () => {
    renderDialog({ ...closedMounting, dismountedAt: undefined })
    expect(screen.queryByRole('checkbox', { name: /re-open/i })).not.toBeInTheDocument()
  })
})
