// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { AssemblyMembership } from '@/types/api'
import { CorrectMembershipDialog } from './CorrectMembershipDialog'

vi.mock('@/api/memberships', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/memberships')>()
  return { ...actual, correctMembership: vi.fn().mockResolvedValue({}) }
})

import * as membershipsApi from '@/api/memberships'

const closedMembership: AssemblyMembership = {
  id: 'm1',
  componentId: 'c1',
  assemblySlotId: 's1',
  assemblyId: 'a1',
  memberFrom: '2026-01-01T10:00:00Z',
  memberTo: '2026-02-01T10:00:00Z',
}

const renderDialog = (membership: AssemblyMembership | null, onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CorrectMembershipDialog open onClose={onClose} membership={membership} />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('CorrectMembershipDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('re-open sends exactly {memberTo: null} with no other keys', async () => {
    const user = userEvent.setup()
    renderDialog(closedMembership)

    await user.click(screen.getByRole('checkbox', { name: /re-open/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(membershipsApi.correctMembership).toHaveBeenCalledTimes(1)
    const [id, body] = vi.mocked(membershipsApi.correctMembership).mock.calls[0]
    expect(id).toBe('m1')
    expect(JSON.stringify(body)).toContain('"memberTo":null')
    expect('memberFrom' in body).toBe(false)
  })

  it('submitting without touching anything sends an empty body', async () => {
    const user = userEvent.setup()
    renderDialog(closedMembership)

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(membershipsApi.correctMembership).toHaveBeenCalledTimes(1)
    const [, body] = vi.mocked(membershipsApi.correctMembership).mock.calls[0]
    expect(body).toEqual({})
  })

  it('does not offer Re-open for an active (open-ended) membership', () => {
    renderDialog({ ...closedMembership, memberTo: undefined })
    expect(screen.queryByRole('checkbox', { name: /re-open/i })).not.toBeInTheDocument()
  })
})
