// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { Link as RouterLink, MemoryRouter } from 'react-router-dom'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { MaintenanceList } from './MaintenanceList'

vi.mock('@/api/maintenance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/maintenance')>()
  return { ...actual, maintenanceTasksQuery: vi.fn() }
})

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({ queryKey: actual.bikesQueryKey, queryFn: async () => [] }),
  }
})

import { maintenanceTasksQuery } from '@/api/maintenance'

/**
 * MaintenanceList sits outside any <Route>, so a query-string navigation updates
 * its search params without remounting it — exactly as under the real router.
 */
const renderList = (initialEntry: string) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <RouterLink to="/maintenance?due=1">app-bar wrench</RouterLink>
            <MaintenanceList />
          </MemoryRouter>
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

const dueOnlyCheckbox = () => screen.getByRole('checkbox', { name: /due only/i })

describe('MaintenanceList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(maintenanceTasksQuery).mockImplementation((filters = {}) => ({
      queryKey: ['maintenanceTasks', 'list', filters],
      queryFn: async () => [],
    }))
  })

  it('checks "Due only" and filters the query when ?due=1 is in the URL', async () => {
    renderList('/maintenance?due=1')

    expect(dueOnlyCheckbox()).toBeChecked()
    await waitFor(() => {
      expect(vi.mocked(maintenanceTasksQuery)).toHaveBeenCalledWith({ due: true })
    })
  })

  it('starts unchecked without the param, and checks on click', async () => {
    const user = userEvent.setup()
    renderList('/maintenance')

    expect(dueOnlyCheckbox()).not.toBeChecked()
    expect(vi.mocked(maintenanceTasksQuery)).toHaveBeenCalledWith({})

    await user.click(dueOnlyCheckbox())

    expect(dueOnlyCheckbox()).toBeChecked()
    await waitFor(() => {
      expect(vi.mocked(maintenanceTasksQuery)).toHaveBeenCalledWith({ due: true })
    })
  })

  it('checks "Due only" when ?due=1 arrives while the list is already mounted', async () => {
    const user = userEvent.setup()
    renderList('/maintenance')

    expect(dueOnlyCheckbox()).not.toBeChecked()

    await user.click(screen.getByRole('link', { name: /app-bar wrench/i }))

    expect(dueOnlyCheckbox()).toBeChecked()
    await waitFor(() => {
      expect(vi.mocked(maintenanceTasksQuery)).toHaveBeenCalledWith({ due: true })
    })
  })
})
