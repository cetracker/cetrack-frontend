// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Component, ComponentType, Mounting, MountPoint } from '@/types/api'
import { CompositionTable } from './CompositionTable'

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

const mandatoryMountPoint: MountPoint = {
  id: 'mp1',
  bikeId: 'b1',
  name: 'Front wheel',
  componentTypeId: 'ct1',
  mandatory: true,
}

const optionalMountPoint: MountPoint = {
  id: 'mp2',
  bikeId: 'b1',
  name: 'Saddle',
  componentTypeId: 'ct1',
  mandatory: false,
}

const componentA: Component = { id: 'c1', componentTypeId: 'ct1', label: 'Comp A', status: 'mounted' }

const renderTable = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CompositionTable bikeId="b1" />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('CompositionTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mountPointsData = []
    mountingsData = []
    componentsData = []
    componentTypesData = [{ id: 'ct1', name: 'Wheel' }]
  })

  it('shows a warning icon for a mandatory mount point with no active mounting', async () => {
    mountPointsData = [mandatoryMountPoint]

    renderTable()

    expect(await screen.findByTestId('WarningAmberIcon')).toBeInTheDocument()
    expect(screen.queryByTestId('CheckBoxIcon')).not.toBeInTheDocument()
  })

  it('shows a muted check icon for a mandatory mount point with an active mounting', async () => {
    mountPointsData = [mandatoryMountPoint]
    componentsData = [componentA]
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-01-01T00:00:00Z',
      },
    ]

    renderTable()

    expect(await screen.findByTestId('CheckBoxIcon')).toBeInTheDocument()
    expect(screen.queryByTestId('WarningAmberIcon')).not.toBeInTheDocument()
  })

  it('shows the check icon (not a false warning) when the active mounting\'s component is missing from componentsData', async () => {
    mountPointsData = [mandatoryMountPoint]
    componentsData = []
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2026-01-01T00:00:00Z',
      },
    ]

    renderTable()

    expect(await screen.findByTestId('CheckBoxIcon')).toBeInTheDocument()
    expect(screen.queryByTestId('WarningAmberIcon')).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows no mandatory indicator for a non-mandatory mount point', async () => {
    mountPointsData = [optionalMountPoint]

    renderTable()

    expect(await screen.findByText('Saddle')).toBeInTheDocument()
    expect(screen.queryByTestId('WarningAmberIcon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('CheckBoxIcon')).not.toBeInTheDocument()
  })
})
