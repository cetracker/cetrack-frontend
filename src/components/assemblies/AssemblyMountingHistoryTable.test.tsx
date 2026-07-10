// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { AssemblyMounting } from '@/types/api'
import { AssemblyMountingHistoryTable } from './AssemblyMountingHistoryTable'

const mounting = (
  id: string,
  mountedAt: string,
  dismountedAt?: string,
): AssemblyMounting => ({
  id,
  assemblyId: 'a1',
  bikeId: 'b1',
  mountedAt,
  dismountedAt,
})

let mountings: AssemblyMounting[] = []

vi.mock('@/api/assemblies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/assemblies')>()
  return {
    ...actual,
    assemblyMountingsQuery: (assemblyId: string) => ({
      queryKey: actual.assemblyMountingsQueryKey(assemblyId),
      queryFn: async () => mountings,
    }),
    voidAssemblyMounting: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({
      queryKey: actual.bikesQueryKey,
      queryFn: async () => [{ id: 'b1', model: 'Roadster' }],
    }),
  }
})

import * as assembliesApi from '@/api/assemblies'

const renderTable = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AssemblyMountingHistoryTable assemblyId="a1" />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('AssemblyMountingHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mountings = []
  })

  it('shows the empty state when there is no history', async () => {
    renderTable()
    expect(await screen.findByText('No mounting history yet.')).toBeInTheDocument()
  })

  it('orders rows mountedAt-desc and shows an active chip for the open mounting', async () => {
    mountings = [
      mounting('am1', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
      mounting('am2', '2026-02-01T00:00:00Z'),
    ]
    renderTable()

    await screen.findByText('active')
    const rows = screen.getAllByRole('row')
    // rows[0] is the header
    expect(rows[1]).toHaveTextContent('active')
    expect(rows[2]).not.toHaveTextContent('active')
  })

  it('allows voiding an active (open-ended) assembly mounting', async () => {
    mountings = [mounting('am1', '2026-01-01T00:00:00Z')]
    const user = userEvent.setup()
    renderTable()

    const voidButton = await screen.findByRole('button', { name: /void/i })
    expect(voidButton).toBeEnabled()
    await user.click(voidButton)
    await user.click(screen.getByRole('button', { name: /^void$/i }))

    expect(assembliesApi.voidAssemblyMounting).toHaveBeenCalledWith('a1', 'am1')
  })

  it('opens the correct dialog on edit', async () => {
    mountings = [mounting('am1', '2026-01-01T00:00:00Z')]
    const user = userEvent.setup()
    renderTable()

    const editButton = await screen.findByRole('button', { name: /correct/i })
    await user.click(editButton)

    expect(await screen.findByText('Correct assembly mounting')).toBeInTheDocument()
  })
})
