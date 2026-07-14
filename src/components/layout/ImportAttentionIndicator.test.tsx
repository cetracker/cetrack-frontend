// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ImportSession } from '@/types/api'
import { ImportAttentionIndicator } from './ImportAttentionIndicator'

vi.mock('@/api/tours', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/tours')>()
  return { ...actual, pendingMyTourbookSessionQuery: vi.fn() }
})

import { pendingMyTourbookSessionQuery } from '@/api/tours'

const renderIndicator = (session: ImportSession | null) => {
  vi.mocked(pendingMyTourbookSessionQuery).mockReturnValue({
    queryKey: ['mytourbook', 'pending'],
    queryFn: async () => session,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ImportAttentionIndicator />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ImportAttentionIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when there is no pending session', async () => {
    renderIndicator(null)

    await waitFor(() => {
      expect(vi.mocked(pendingMyTourbookSessionQuery)).toHaveBeenCalled()
    })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('badges the pending candidate count and links to the import review', async () => {
    renderIndicator({
      sessionId: 's1',
      status: 'PENDING',
      dbVersion: 1,
      hasDrift: false,
      candidates: [{}, {}, {}] as ImportSession['candidates'],
      warnings: [],
    })

    const link = await screen.findByRole('link', { name: /review import/i })
    expect(link).toHaveAttribute('href', '/mytourbookImport')
    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('shows the duplicate-warning alert icon along with the candidate count', async () => {
    renderIndicator({
      sessionId: 's2',
      status: 'PENDING',
      dbVersion: 1,
      hasDrift: false,
      candidates: [{}] as ImportSession['candidates'],
      warnings: [{ type: 'LOGICAL_DUPLICATE', message: 'dup' }],
    })

    await screen.findByRole('link', { name: /review import/i })
    expect(await screen.findByText('1')).toBeInTheDocument()
  })

  it('shows the duplicate-warning alert icon with no number when there are no new candidates', async () => {
    renderIndicator({
      sessionId: 's3',
      status: 'PENDING',
      dbVersion: 1,
      hasDrift: false,
      candidates: [],
      warnings: [{ type: 'LOGICAL_DUPLICATE', message: 'dup' }],
    })

    await screen.findByRole('link', { name: /review import/i })
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
