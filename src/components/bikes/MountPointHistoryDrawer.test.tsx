// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Component, Mounting, MountPoint } from '@/types/api'
import { MountPointHistoryDrawer } from './MountPointHistoryDrawer'

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({
      queryKey: actual.bikesQueryKey,
      queryFn: async () => [],
    }),
    mountComponent: vi.fn().mockResolvedValue({}),
  }
})

let mountingsData: Mounting[] = []
vi.mock('@/api/mountings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/mountings')>()
  return {
    ...actual,
    mountingsQuery: (filters: unknown) => ({
      queryKey: actual.mountingsQueryKey(filters as Record<string, unknown>),
      queryFn: async () => mountingsData,
    }),
  }
})

let componentsData: Component[] = []
vi.mock('@/api/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/components')>()
  return {
    ...actual,
    componentsQuery: () => ({
      queryKey: actual.componentsQueryKey(),
      queryFn: async () => componentsData,
    }),
  }
})

const mountPoint: MountPoint = {
  id: 'mp1',
  bikeId: 'b1',
  name: 'Front wheel',
  componentTypeId: 'ct1',
  mandatory: false,
}

const componentA: Component = { id: 'c1', componentTypeId: 'ct1', label: 'Comp A', status: 'inStock' }
const componentB: Component = { id: 'c2', componentTypeId: 'ct1', label: 'Comp B', status: 'inStock' }
const componentActive: Component = {
  id: 'c3',
  componentTypeId: 'ct1',
  label: 'Comp Active',
  status: 'mounted',
}
const componentRetired: Component = {
  id: 'c4',
  componentTypeId: 'ct1',
  label: 'Comp Retired',
  status: 'retired',
}

const renderDrawer = (mp: MountPoint | null = mountPoint, onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MountPointHistoryDrawer open onClose={onClose} bikeId="b1" mountPoint={mp} />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('MountPointHistoryDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mountingsData = []
    componentsData = []
  })

  it('shows a re-use button exactly once per unique component, excluding active and retired', async () => {
    mountingsData = [
      // two mountings of c1 (closed) — one re-use button, most-recent row
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-01-01T00:00:00Z',
        dismountedAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 'm2',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-02-01T00:00:00Z',
        dismountedAt: '2026-02-05T00:00:00Z',
      },
      // retired component — no re-use
      {
        id: 'm3',
        componentId: 'c4',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-03-01T00:00:00Z',
        dismountedAt: '2026-03-05T00:00:00Z',
      },
      // currently active — no re-use
      {
        id: 'm4',
        componentId: 'c3',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-04-01T00:00:00Z',
      },
    ]
    componentsData = [componentA, componentB, componentActive, componentRetired]

    renderDrawer()

    const reuseButtons = await screen.findAllByRole('button', { name: /re-use/i })
    expect(reuseButtons).toHaveLength(1)
  })

  it('empty history shows empty state and "Mount other component…" opens MountDialog', async () => {
    const user = userEvent.setup()
    renderDrawer()

    expect(await screen.findByText(/no mountings yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /mount other component/i }))
    expect(await screen.findByRole('heading', { name: /mount to front wheel/i })).toBeInTheDocument()
  })

  it('clicking re-use opens the re-mount dialog with warning when occupied', async () => {
    const user = userEvent.setup()
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-01-01T00:00:00Z',
        dismountedAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 'm2',
        componentId: 'c3',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-02-01T00:00:00Z',
      },
    ]
    componentsData = [componentA, componentActive]

    renderDrawer()

    const reuseButton = await screen.findByRole('button', { name: /re-use/i })
    await user.click(reuseButton)

    expect(await screen.findByText(/re-mount comp a/i)).toBeInTheDocument()
    expect(screen.getByText(/mounting this component will dismount comp active/i)).toBeInTheDocument()
  })
})
