// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VersionInfo } from './VersionInfo'

vi.mock('@/api/info', () => ({
  backendInfoQuery: vi.fn(),
}))

import { backendInfoQuery } from '@/api/info'

const renderComponent = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <VersionInfo />
    </QueryClientProvider>,
  )
}

describe('VersionInfo', () => {
  it('shows a warning icon and keeps the frontend line when the backend is unreachable', async () => {
    vi.mocked(backendInfoQuery).mockReturnValue({
      queryKey: ['backend-info'],
      queryFn: () => Promise.reject(new Error('network error')),
      retry: false,
    })

    renderComponent()

    expect(screen.getByText(/frontend v/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/backend unreachable/i)).toBeInTheDocument()
    })
  })

  it('shows the backend version when reachable', async () => {
    vi.mocked(backendInfoQuery).mockReturnValue({
      queryKey: ['backend-info'],
      queryFn: () => Promise.resolve({ version: '0.7.0', buildTime: '2026-07-01T18:33:22.511Z' }),
      retry: false,
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Backend v0.7.0')).toBeInTheDocument()
    })
  })
})
