// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Assembly, AssemblyMembership, AssemblySlot, Component } from '@/types/api'
import { SlotMemberHistoryDrawer } from './SlotMemberHistoryDrawer'

let membershipsData: AssemblyMembership[] = []
vi.mock('@/api/memberships', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/memberships')>()
  return {
    ...actual,
    membershipsQuery: (filters: unknown) => ({
      queryKey: actual.membershipsQueryKey(filters as Record<string, unknown>),
      queryFn: async () => membershipsData,
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

vi.mock('@/api/assemblies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/assemblies')>()
  return {
    ...actual,
    addAssemblyMember: vi.fn().mockResolvedValue({}),
    assemblyMountingsQuery: () => ({
      queryKey: ['assemblies', 'a1', 'mountings'],
      queryFn: async () => [],
    }),
  }
})

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({ queryKey: ['bikes'], queryFn: async () => [] }),
  }
})

const assembly: Assembly = {
  id: 'a1',
  name: 'Test Assembly',
  complete: false,
  mounted: false,
  slots: [],
}

const slot: AssemblySlot = {
  id: 's1',
  name: 'Frame',
  componentTypeId: 'ct1',
  validFrom: '2026-01-01T00:00:00Z',
}

const componentA: Component = { id: 'c1', componentTypeId: 'ct1', label: 'Comp A', status: 'inStock' }
const componentActive: Component = { id: 'c3', componentTypeId: 'ct1', label: 'Comp Active', status: 'inStock' }
const componentElsewhere: Component = { id: 'c5', componentTypeId: 'ct1', label: 'Comp Elsewhere', status: 'inAssembly' }
const componentRetired: Component = { id: 'c4', componentTypeId: 'ct1', label: 'Comp Retired', status: 'retired' }

const renderDrawer = (
  props: Partial<Parameters<typeof SlotMemberHistoryDrawer>[0]> = {},
  onClose = vi.fn(),
) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <SlotMemberHistoryDrawer
            open
            onClose={onClose}
            assemblyId="a1"
            assembly={assembly}
            slot={slot}
            {...props}
          />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('SlotMemberHistoryDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    membershipsData = []
    componentsData = []
  })

  it('shows a re-use button exactly once per unique eligible past member, excluding active/retired/member-elsewhere', async () => {
    membershipsData = [
      { id: 'm1', componentId: 'c1', assemblySlotId: 's1', assemblyId: 'a1', memberFrom: '2026-01-01T00:00:00Z', memberTo: '2026-01-05T00:00:00Z' },
      { id: 'm2', componentId: 'c1', assemblySlotId: 's1', assemblyId: 'a1', memberFrom: '2026-02-01T00:00:00Z', memberTo: '2026-02-05T00:00:00Z' },
      { id: 'm3', componentId: 'c4', assemblySlotId: 's1', assemblyId: 'a1', memberFrom: '2026-03-01T00:00:00Z', memberTo: '2026-03-05T00:00:00Z' },
      { id: 'm5', componentId: 'c5', assemblySlotId: 's1', assemblyId: 'a1', memberFrom: '2026-03-10T00:00:00Z', memberTo: '2026-03-15T00:00:00Z' },
      { id: 'm4', componentId: 'c3', assemblySlotId: 's1', assemblyId: 'a1', memberFrom: '2026-04-01T00:00:00Z' },
    ]
    componentsData = [componentA, componentActive, componentRetired, componentElsewhere]

    renderDrawer()

    const reuseButtons = await screen.findAllByRole('button', { name: /re-use/i })
    expect(reuseButtons).toHaveLength(1)
  })

  it('empty history shows empty state and "Add other component…" opens AddMemberDialog', async () => {
    const user = userEvent.setup()
    renderDrawer()

    expect(await screen.findByText(/no members yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add other component/i }))
    expect(await screen.findByRole('heading', { name: /add member to frame/i })).toBeInTheDocument()
  })

  it('clicking re-use opens the re-use dialog with a warning when the slot is occupied', async () => {
    const user = userEvent.setup()
    membershipsData = [
      { id: 'm1', componentId: 'c1', assemblySlotId: 's1', assemblyId: 'a1', memberFrom: '2026-01-01T00:00:00Z', memberTo: '2026-01-05T00:00:00Z' },
      { id: 'm2', componentId: 'c3', assemblySlotId: 's1', assemblyId: 'a1', memberFrom: '2026-02-01T00:00:00Z' },
    ]
    componentsData = [componentA, componentActive]

    renderDrawer()

    const reuseButton = await screen.findByRole('button', { name: /re-use/i })
    await user.click(reuseButton)

    expect(await screen.findByText(/re-use comp a/i)).toBeInTheDocument()
    expect(screen.getByText(/will end comp active's membership/i)).toBeInTheDocument()
  })
})
