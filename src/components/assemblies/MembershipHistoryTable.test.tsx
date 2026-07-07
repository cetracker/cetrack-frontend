// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AssemblyMembership } from '@/types/api'
import { MembershipHistoryTable } from './MembershipHistoryTable'

vi.mock('@/api/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/components')>()
  return {
    ...actual,
    componentsQuery: () => ({
      queryKey: actual.componentsQueryKey(),
      queryFn: async () => [
        { id: 'c1', componentTypeId: 'ct1', label: 'Component One', status: 'inStock' },
        { id: 'c2', componentTypeId: 'ct1', label: 'Component Two', status: 'inStock' },
      ],
    }),
  }
})

const renderTable = (props: {
  memberships: AssemblyMembership[]
  onReuse?: (componentId: string) => void
  reuseComponentIds?: string[]
}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MembershipHistoryTable {...props} />
    </QueryClientProvider>,
  )
}

const membership = (
  componentId: string,
  memberFrom: string,
  memberTo?: string,
): AssemblyMembership => ({
  id: `${componentId}-${memberFrom}`,
  componentId,
  assemblySlotId: 's1',
  assemblyId: 'a1',
  memberFrom,
  memberTo,
})

describe('MembershipHistoryTable', () => {
  it('shows the empty state when there is no history', () => {
    renderTable({ memberships: [] })
    expect(screen.getByText('No members yet.')).toBeInTheDocument()
  })

  it('orders rows memberFrom-desc and shows an active chip for the open membership', async () => {
    renderTable({
      memberships: [
        membership('c1', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
        membership('c2', '2026-02-01T00:00:00Z'),
      ],
    })

    await screen.findByText('Component Two')
    const rows = screen.getAllByRole('row')
    // rows[0] is the header
    expect(rows[1]).toHaveTextContent('Component Two')
    expect(rows[1]).toHaveTextContent('active')
    expect(rows[2]).toHaveTextContent('Component One')
  })

  it('shows one re-use button per unique component and calls onReuse with its id', async () => {
    const user = userEvent.setup()
    const onReuse = vi.fn()
    renderTable({
      memberships: [
        membership('c1', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z'),
        membership('c1', '2026-03-01T00:00:00Z', '2026-04-01T00:00:00Z'),
      ],
      onReuse,
      reuseComponentIds: ['c1'],
    })

    const buttons = await screen.findAllByRole('button', { name: /re-use/i })
    expect(buttons).toHaveLength(1)
    await user.click(buttons[0])
    expect(onReuse).toHaveBeenCalledWith('c1')
  })

  it('shows no re-use button when the component is not in reuseComponentIds', () => {
    renderTable({
      memberships: [membership('c1', '2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z')],
      onReuse: vi.fn(),
      reuseComponentIds: [],
    })
    expect(screen.queryByRole('button', { name: /re-use/i })).not.toBeInTheDocument()
  })
})
