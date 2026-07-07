// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { MaintenanceEventsTable } from './MaintenanceEventsTable'
import type { MaintenanceEvent } from '@/types/api'

vi.mock('@/api/maintenance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/maintenance')>()
  return {
    ...actual,
    maintenanceEventsQuery: (taskId: string) => ({
      queryKey: actual.maintenanceEventsQueryKey(taskId),
      queryFn: async (): Promise<MaintenanceEvent[]> => events,
    }),
  }
})

let events: MaintenanceEvent[] = []

const renderTable = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <MaintenanceEventsTable taskId="t1" />
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('MaintenanceEventsTable', () => {
  it('renders the distance-since-previous km column', async () => {
    events = [
      {
        id: 'e2',
        maintenanceTaskId: 't1',
        performedAt: '2025-03-01T00:00:00Z',
        distanceSincePrevious: 200_000,
      },
      {
        id: 'e1',
        maintenanceTaskId: 't1',
        performedAt: '2025-01-15T00:00:00Z',
        distanceSincePrevious: 100_000,
      },
    ]
    renderTable()

    expect(await screen.findByText('200.0 km')).toBeInTheDocument()
    expect(screen.getByText('100.0 km')).toBeInTheDocument()
  })

  it('renders an empty cell when distanceSincePrevious is undefined', async () => {
    events = [
      { id: 'e1', maintenanceTaskId: 't1', performedAt: '2025-01-15T00:00:00Z' },
    ]
    renderTable()

    expect(await screen.findByText('Ridden since previous')).toBeInTheDocument()
    expect(screen.queryByText(/km/)).not.toBeInTheDocument()
  })
})
