// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import i18n from '@/i18n'
import type { Bike, Component, ComponentType, Mounting } from '@/types/api'
import { ComponentList } from './ComponentList'

let componentsData: Component[] = []
let componentTypesData: ComponentType[] = []
let mountingsData: Mounting[] = []
let bikesData: Bike[] = []

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

vi.mock('@/api/catalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/catalog')>()
  return {
    ...actual,
    componentTypesQuery: () => ({
      queryKey: ['componentTypes'],
      queryFn: async () => componentTypesData,
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

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({
      queryKey: ['bikes'],
      queryFn: async () => bikesData,
    }),
  }
})

const renderList = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <ComponentList />
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('ComponentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    componentTypesData = [{ id: 'ct1', name: 'Wheel' }]
    bikesData = [{ id: 'b1', name: 'Speedster' }]
  })

  it('shows "Currently In Use As" header and populates active mounting usage', async () => {
    componentsData = [
      { id: 'c1', componentTypeId: 'ct1', label: 'Mounted Wheel', status: 'mounted' },
      { id: 'c2', componentTypeId: 'ct1', label: 'Spare Wheel', status: 'inStock' },
    ]
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'm2',
        componentId: 'c2',
        mountPointId: 'mp2',
        bikeId: 'b1',
        mountPointName: 'Rear wheel',
        mountedAt: '2024-01-01T00:00:00Z',
        dismountedAt: '2024-06-01T00:00:00Z',
      },
    ]

    renderList()

    expect(await screen.findByText('Currently In Use As')).toBeInTheDocument()
    expect(await screen.findByText('Front wheel on Speedster')).toBeInTheDocument()
    expect(await screen.findByText('Mounted Wheel')).toBeInTheDocument()
    expect(await screen.findByText('Spare Wheel')).toBeInTheDocument()
  })

  it('distinguishes a direct mounting from a governed one in the status chip (CE-0106)', async () => {
    componentsData = [
      { id: 'c1', componentTypeId: 'ct1', label: 'Direct', status: 'mounted', directlyMounted: true },
      { id: 'c2', componentTypeId: 'ct1', label: 'Via Assembly', status: 'mounted', directlyMounted: false },
    ]
    mountingsData = []

    renderList()

    expect(await screen.findByText('Direct')).toBeInTheDocument()
    expect(screen.getByText('Mounted')).toBeInTheDocument()
    expect(screen.getByText('Mounted (via assembly)')).toBeInTheDocument()
  })

  it('shows "Show details" as the row action tooltip label', async () => {
    componentsData = [
      { id: 'c1', componentTypeId: 'ct1', label: 'Wheel A', status: 'inStock' },
    ]
    mountingsData = []

    renderList()

    expect(await screen.findByText('Wheel A')).toBeInTheDocument()
    expect(screen.getByLabelText('Show details')).toBeInTheDocument()
  })

  describe('status filter menu', () => {
    afterEach(() => void i18n.changeLanguage('en'))

    it('shows translated status options in English', async () => {
      const user = userEvent.setup()
      componentsData = []
      mountingsData = []

      renderList()

      await user.click(screen.getByLabelText('Status'))
      expect(await screen.findByRole('option', { name: 'In stock' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Mounted' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Retired' })).toBeInTheDocument()
    })

    it('shows translated status options in German', async () => {
      await i18n.changeLanguage('de')
      const user = userEvent.setup()
      componentsData = []
      mountingsData = []

      renderList()

      await user.click(screen.getByLabelText('Status'))
      expect(await screen.findByRole('option', { name: 'Auf Lager' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Montiert' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Ausgemustert' })).toBeInTheDocument()
    })
  })
})
