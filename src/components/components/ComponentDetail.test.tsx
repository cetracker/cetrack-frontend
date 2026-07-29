// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { AssemblyMembership, Component, Mounting } from '@/types/api'
import { ComponentDetail } from './ComponentDetail'

let componentData: Component | undefined
let mountingsData: Mounting[] = []
let membershipsData: AssemblyMembership[] = []

vi.mock('@/api/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/components')>()
  return {
    ...actual,
    componentQuery: (id: string) => ({
      queryKey: actual.componentQueryKey(id),
      queryFn: async () => componentData,
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

vi.mock('@/api/memberships', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/memberships')>()
  return {
    ...actual,
    membershipsQuery: (filters: Record<string, unknown>) => ({
      queryKey: ['memberships', filters],
      queryFn: async () => membershipsData,
    }),
  }
})

const renderDetail = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <MemoryRouter>
          <ComponentDetail open componentId="c1" onClose={() => {}} />
        </MemoryRouter>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('ComponentDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mountingsData = []
    membershipsData = []
  })

  it('renders the status pill as a link to the governing assembly when mounted via assembly (CE-0112)', async () => {
    componentData = {
      id: 'c1',
      componentTypeId: 'ct1',
      label: 'Via Assembly',
      status: 'mounted',
      directlyMounted: false,
    }
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        assemblyMountingId: 'am1',
        assemblyId: 'a1',
        mountedAt: '2025-01-01T00:00:00Z',
      },
    ]

    renderDetail()

    const link = await screen.findByRole('link', { name: 'Go to assembly' })
    expect(link).toHaveAttribute('href', '/assemblies/a1')
    expect(link).toHaveTextContent('Mounted (via assembly)')
  })

  it('keeps the pill a plain chip (not a link) when directly mounted', async () => {
    componentData = {
      id: 'c1',
      componentTypeId: 'ct1',
      label: 'Direct',
      status: 'mounted',
      directlyMounted: true,
    }
    mountingsData = [
      {
        id: 'm1',
        componentId: 'c1',
        mountPointId: 'mp1',
        bikeId: 'b1',
        mountPointName: 'Front wheel',
        mountedAt: '2025-01-01T00:00:00Z',
      },
    ]

    renderDetail()

    expect((await screen.findAllByText('Mounted'))[0]).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Go to assembly' })).not.toBeInTheDocument()
  })

  it('keeps the pill a plain chip (not a link) when in stock', async () => {
    componentData = {
      id: 'c1',
      componentTypeId: 'ct1',
      label: 'Spare',
      status: 'inStock',
    }
    mountingsData = []

    renderDetail()

    expect(await screen.findByText('In stock')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Go to assembly' })).not.toBeInTheDocument()
  })

  it('renders the status pill as a link to the assembly when in assembly', async () => {
    componentData = {
      id: 'c1',
      componentTypeId: 'ct1',
      label: 'Member',
      status: 'inAssembly',
    }
    membershipsData = [
      {
        id: 'mb1',
        componentId: 'c1',
        assemblySlotId: 'sl1',
        assemblyId: 'a2',
        memberFrom: '2025-01-01T00:00:00Z',
        memberTo: null,
      },
    ]

    renderDetail()

    const link = await screen.findByRole('link', { name: 'Go to assembly' })
    expect(link).toHaveAttribute('href', '/assemblies/a2')
    expect(link).toHaveTextContent('In assembly')
  })
})
