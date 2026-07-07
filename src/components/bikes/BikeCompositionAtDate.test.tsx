// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import type { Component, ComponentType, Mounting, MountPoint } from '@/types/api'
import { BikeCompositionAtDate } from './BikeCompositionAtDate'

let mountPointsData: MountPoint[] = []
vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    mountPointsQuery: (bikeId: string) => ({
      queryKey: actual.mountPointsQueryKey(bikeId),
      queryFn: async () => mountPointsData,
    }),
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

let componentTypesData: ComponentType[] = []
vi.mock('@/api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/catalog')>()
  return {
    ...actual,
    componentTypesQuery: () => ({
      queryKey: actual.componentTypesQueryKey,
      queryFn: async () => componentTypesData,
    }),
    positionsQuery: () => ({
      queryKey: actual.positionsQueryKey,
      queryFn: async () => [],
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

const component: Component = {
  id: 'c1',
  componentTypeId: 'ct1',
  label: 'Comp A',
  status: 'retired',
}

const renderSnapshot = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <BikeCompositionAtDate bikeId="b1" />
      </LocalizationProvider>
    </QueryClientProvider>,
  )
}

describe('BikeCompositionAtDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mountPointsData = [mountPoint]
    componentTypesData = [{ id: 'ct1', name: 'Wheel' }]
    componentsData = [component]
  })

  it('resolves a mount point to its component at a past instant even though the mounting is now closed', async () => {
    // dismountedAt is non-null and later than the picked activeAt — the exact
    // case where using `activeMounting` (find !dismountedAt) would wrongly
    // render '—' instead of the historically-mounted component.
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-01-01T00:00:00Z',
        dismountedAt: '2026-06-01T00:00:00Z',
      },
    ]

    renderSnapshot()

    expect(await screen.findByText('Comp A')).toBeInTheDocument()
  })

  it('shows the (i) info button for a mounted component with details', async () => {
    componentsData = [{ ...component, manufacturer: 'Shimano' }]
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-01-01T00:00:00Z',
        dismountedAt: '2026-06-01T00:00:00Z',
      },
    ]

    renderSnapshot()

    expect(
      await screen.findByRole('button', { name: 'Component details' }),
    ).toBeInTheDocument()
  })
})
