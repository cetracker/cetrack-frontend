// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import type { MaintenanceTask } from '@/types/api'
import { MaintenanceDueIndicator } from './MaintenanceDueIndicator'

vi.mock('@/api/maintenance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/maintenance')>()
  return { ...actual, maintenanceTasksQuery: vi.fn() }
})

import { maintenanceTasksQuery } from '@/api/maintenance'

const task = (id: string) => ({ id, name: `Task ${id}` }) as MaintenanceTask

const renderIndicator = (tasks: MaintenanceTask[]) => {
  vi.mocked(maintenanceTasksQuery).mockReturnValue({
    queryKey: ['maintenanceTasks', 'list', { due: true }],
    queryFn: async () => tasks,
  })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <MaintenanceDueIndicator />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MaintenanceDueIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no task is due', async () => {
    renderIndicator([])

    await waitFor(() => {
      expect(vi.mocked(maintenanceTasksQuery)).toHaveBeenCalledWith({ due: true })
    })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('badges the due count and links to the filtered maintenance list', async () => {
    renderIndicator([task('t1'), task('t2')])

    const link = await screen.findByRole('link', { name: /review maintenance/i })
    expect(link).toHaveAttribute('href', '/maintenance?due=1')
    expect(await screen.findByText('2')).toBeInTheDocument()
  })
})
