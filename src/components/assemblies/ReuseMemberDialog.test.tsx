// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { ApiException } from '@/api/client'
import { ReuseMemberDialog } from './ReuseMemberDialog'

vi.mock('@/api/assemblies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/assemblies')>()
  return {
    ...actual,
    addAssemblyMember: vi.fn().mockResolvedValue({}),
    assemblyMountingsQuery: () => ({
      queryKey: ['assemblies', 'a1', 'mountings'],
      queryFn: async () => [
        { id: 'am1', assemblyId: 'a1', bikeId: 'b1', mountedAt: '2026-01-01T00:00:00Z' },
      ],
    }),
  }
})

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({
      queryKey: ['bikes'],
      queryFn: async () => [{ id: 'b1', model: 'Roadster' }],
    }),
  }
})

import * as assembliesApi from '@/api/assemblies'

const renderDialog = (
  props: Partial<Parameters<typeof ReuseMemberDialog>[0]> = {},
  onClose = vi.fn(),
) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ReuseMemberDialog
            open
            onClose={onClose}
            assemblyId="a1"
            slotId="s1"
            componentId="c1"
            componentName="Widget"
            assemblyMounted={false}
            {...props}
          />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('ReuseMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assembliesApi.addAssemblyMember).mockResolvedValue({})
  })

  it('confirm calls addAssemblyMember with componentId, slotId and from', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: /^re-use$/i }))

    expect(assembliesApi.addAssemblyMember).toHaveBeenCalledTimes(1)
    const [assemblyId, body] = vi.mocked(assembliesApi.addAssemblyMember).mock.calls[0]
    expect(assemblyId).toBe('a1')
    expect(body.componentId).toBe('c1')
    expect(body.slotId).toBe('s1')
    expect(body.from).toBeTruthy()
  })

  it('shows no warning when the slot is empty', () => {
    renderDialog({ activeComponentName: undefined })
    expect(screen.queryByText(/will end/i)).not.toBeInTheDocument()
  })

  it('shows the ends-membership warning when the slot is occupied', () => {
    renderDialog({ activeComponentName: 'Old Part' })
    expect(screen.getByText(/will end old part's membership/i)).toBeInTheDocument()
    expect(screen.queryByText(/dismount it/i)).not.toBeInTheDocument()
  })

  it('mentions dismounting the occupant when the assembly is mounted', () => {
    renderDialog({ activeComponentName: 'Old Part', assemblyMounted: true })
    expect(screen.getByText(/will end old part's membership and dismount it/i)).toBeInTheDocument()
  })

  it('shows a candidate picker after a 409 UNRESOLVED_SLOTS, keeping the warning visible, then resubmits with mountPointId', async () => {
    const user = userEvent.setup()
    vi.mocked(assembliesApi.addAssemblyMember)
      .mockRejectedValueOnce(
        new ApiException({
          status: 409,
          code: 'UNRESOLVED_SLOTS',
          message: 'raw',
          details: {
            candidates: [
              { mountPointId: 'mp1', mountPointName: 'Front wheel' },
              { mountPointId: 'mp2', mountPointName: 'Rear wheel' },
            ],
          },
        }),
      )
      .mockResolvedValueOnce({})

    renderDialog({ activeComponentName: 'Old Part', assemblyMounted: true })

    await user.click(screen.getByRole('button', { name: /^re-use$/i }))

    expect(await screen.findByLabelText(/mount point/i)).toBeInTheDocument()
    expect(screen.getByText(/will end old part's membership and dismount it/i)).toBeInTheDocument()

    await user.click(screen.getByLabelText(/mount point/i))
    await user.click(await screen.findByRole('option', { name: 'Rear wheel' }))
    await user.click(screen.getByRole('button', { name: /resolve & re-use/i }))

    expect(assembliesApi.addAssemblyMember).toHaveBeenCalledTimes(2)
    const [, secondBody] = vi.mocked(assembliesApi.addAssemblyMember).mock.calls[1]
    expect(secondBody.mountPointId).toBe('mp2')
  }, 10000)

  it('shows a tailored inline error and keeps the dialog open on MOUNTING_GOVERNED, reassuring the occupant is unchanged', async () => {
    const user = userEvent.setup()
    vi.mocked(assembliesApi.addAssemblyMember).mockRejectedValueOnce(
      new ApiException({ status: 409, code: 'MOUNTING_GOVERNED', message: 'raw' }),
    )

    renderDialog({ activeComponentName: 'Old Part', assemblyMounted: true })
    await user.click(screen.getByRole('button', { name: /^re-use$/i }))

    expect(await screen.findByText(/couldn't swap in widget/i)).toBeInTheDocument()
    expect(screen.getByText(/old part is unchanged/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^re-use$/i })).toBeInTheDocument()
  })

  it('shows a tailored inline error on SLOT_UNMOUNTABLE', async () => {
    const user = userEvent.setup()
    vi.mocked(assembliesApi.addAssemblyMember).mockRejectedValueOnce(
      new ApiException({ status: 409, code: 'SLOT_UNMOUNTABLE', message: 'raw' }),
    )

    renderDialog({ activeComponentName: 'Old Part', assemblyMounted: true })
    await user.click(screen.getByRole('button', { name: /^re-use$/i }))

    expect(await screen.findByText(/can't be mounted at this slot's resolved mount point/i)).toBeInTheDocument()
  })
})
