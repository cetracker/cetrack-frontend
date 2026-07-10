// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import type { Assembly, Component, ComponentType } from '@/types/api'
import { AssemblyMembershipSnapshot } from './AssemblyMembershipSnapshot'

let assemblyData: Assembly | undefined
vi.mock('@/api/assemblies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/assemblies')>()
  return {
    ...actual,
    assemblyQuery: (id: string, at?: string) => ({
      queryKey: actual.assemblyQueryKey(id),
      queryFn: async () => assemblyData,
      enabled: !!at,
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
  }
})

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
        <AssemblyMembershipSnapshot assemblyId="a1" />
      </LocalizationProvider>
    </QueryClientProvider>,
  )
}

describe('AssemblyMembershipSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    componentTypesData = [{ id: 'ct1', name: 'Wheel' }]
    componentsData = [component]
  })

  it('resolves a slot to its component at a past instant even though the membership is now closed', async () => {
    // memberFrom/memberComponentId reflect the at-scoped server response, where a
    // membership whose memberTo is non-null and later than the picked instant is
    // still resolved. Guards against re-introducing client-side open-membership filtering.
    assemblyData = {
      id: 'a1',
      name: 'Wheelset',
      complete: true,
      mounted: false,
      slots: [
        {
          id: 'slot1',
          name: 'Front',
          componentTypeId: 'ct1',
          validFrom: '2025-01-01T00:00:00Z',
          memberComponentId: 'c1',
          memberFrom: '2026-01-01T00:00:00Z',
        },
      ],
    }

    renderSnapshot()

    expect(await screen.findByText('Comp A')).toBeInTheDocument()
  })

  it('renders an em-dash for a slot with no member at the instant', async () => {
    assemblyData = {
      id: 'a1',
      name: 'Wheelset',
      complete: false,
      mounted: false,
      slots: [
        {
          id: 'slot1',
          name: 'Front',
          componentTypeId: 'ct1',
          validFrom: '2025-01-01T00:00:00Z',
        },
      ],
    }

    renderSnapshot()

    expect(await screen.findByText('—')).toBeInTheDocument()
    expect(screen.queryByText('Comp A')).not.toBeInTheDocument()
  })
})
