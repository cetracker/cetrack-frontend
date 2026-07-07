// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Bike, Component, Mounting, MountPoint } from '@/types/api'
import { MountComponentDialog } from './MountComponentDialog'

let bikesData: Bike[] = []
let mountPointsData: MountPoint[] = []
let mountingsData: Mounting[] = []
let componentsData: Component[] = []

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({
      queryKey: ['bikes'],
      queryFn: async () => bikesData,
    }),
    mountPointsQuery: (bikeId: string) => ({
      queryKey: ['bikes', bikeId, 'mountPoints'],
      queryFn: async () => mountPointsData,
    }),
    mountComponent: vi.fn().mockResolvedValue({}),
  }
})

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

vi.mock('@/api/mountings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/mountings')>()
  return {
    ...actual,
    mountingsQuery: (filters: Record<string, unknown>) => ({
      queryKey: ['mountings', filters],
      queryFn: async () => mountingsData,
    }),
  }
})

import * as bikesApi from '@/api/bikes'

const component: Component = {
  id: 'c1',
  componentTypeId: 'ct1',
  label: 'New Widget',
  status: 'inStock',
}

const renderDialog = (onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MountComponentDialog open onClose={onClose} component={component} />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('MountComponentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    bikesData = [
      { id: 'b1', name: 'Speedster' },
      { id: 'b2', name: 'Retired Ride', retiredAt: '2025-01-01T00:00:00Z' },
    ]
    mountPointsData = [
      { id: 'mp1', bikeId: 'b1', name: 'Front wheel', componentTypeId: 'ct1', mandatory: false },
      { id: 'mp2', bikeId: 'b1', name: 'Seat post', componentTypeId: 'ct2', mandatory: false },
    ]
    mountingsData = []
    componentsData = []
  })

  it('excludes retired bikes from the bike picker', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByLabelText(/bike/i))
    expect(screen.getByText('Speedster')).toBeInTheDocument()
    expect(screen.queryByText('Retired Ride')).not.toBeInTheDocument()
  })

  it('only offers mount points compatible with the component type', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByLabelText(/bike/i))
    await user.click(screen.getByText('Speedster'))

    await user.click(screen.getByLabelText(/mount point/i))
    expect(screen.getByText('Front wheel')).toBeInTheDocument()
    expect(screen.queryByText('Seat post')).not.toBeInTheDocument()
  })

  it('shows a dismount warning when the selected mount point is occupied', async () => {
    mountingsData = [
      {
        id: 'm1',
        componentId: 'other',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2025-01-01T00:00:00Z',
      },
    ]
    componentsData = [
      { id: 'other', componentTypeId: 'ct1', label: 'Old Widget', status: 'mounted' },
    ]

    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByLabelText(/bike/i))
    await user.click(screen.getByText('Speedster'))

    await user.click(screen.getByLabelText(/mount point/i))
    await user.click(screen.getByText(/front wheel — currently: old widget/i))

    expect(screen.getByText(/mounting here will dismount old widget/i)).toBeInTheDocument()
  })

  it('submits mountComponent with bikeId, mountPointId and componentId', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByLabelText(/bike/i))
    await user.click(screen.getByText('Speedster'))

    await user.click(screen.getByLabelText(/mount point/i))
    await user.click(screen.getByText('Front wheel'))

    await user.click(screen.getByRole('button', { name: /^mount$/i }))

    expect(bikesApi.mountComponent).toHaveBeenCalledTimes(1)
    const [bikeId, mountPointId, body] = vi.mocked(bikesApi.mountComponent).mock.calls[0]
    expect(bikeId).toBe('b1')
    expect(mountPointId).toBe('mp1')
    expect(body.componentId).toBe('c1')
    expect(body.at).toBeTruthy()
  })
})
