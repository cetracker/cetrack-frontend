// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { ApiException } from '@/api/client'
import type { Assembly, AssemblySlot } from '@/types/api'
import { AddMemberDialog } from './AddMemberDialog'

vi.mock('@/api/assemblies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/assemblies')>()
  return { ...actual, addAssemblyMember: vi.fn() }
})

const componentsQueryMock = vi.fn()

vi.mock('@/api/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/components')>()
  return {
    ...actual,
    componentsQuery: (filters: unknown) => {
      componentsQueryMock(filters)
      return {
        queryKey: actual.componentsQueryKey(filters as never),
        queryFn: async () => [
          { id: 'c1', componentTypeId: 'ct1', label: 'Component One', status: 'inStock' },
          {
            id: 'c2',
            componentTypeId: 'ct1',
            label: 'Component Two',
            status: 'mounted',
            directlyMounted: true,
          },
          { id: 'c3', componentTypeId: 'ct1', label: 'Component Three', status: 'retired' },
        ],
      }
    },
  }
})

import * as assembliesApi from '@/api/assemblies'

const assembly: Assembly = {
  id: 'a1',
  name: 'Test Assembly',
  complete: false,
  mounted: true,
  slots: [],
}

const slot: AssemblySlot = {
  id: 's1',
  name: 'Frame',
  componentTypeId: 'ct1',
  validFrom: '2026-01-01T00:00:00Z',
}

const renderDialog = (onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AddMemberDialog
            open
            onClose={onClose}
            assemblyId="a1"
            assembly={assembly}
            slot={slot}
          />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

const pickComponent = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('combobox', { name: /component/i }))
  await user.click(await screen.findByRole('option', { name: 'Component One' }))
}

describe('AddMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queries by componentTypeId only - no status filter (CE-0106: mounted components are candidates)', async () => {
    renderDialog()
    await screen.findByRole('combobox', { name: /component/i })
    expect(componentsQueryMock).toHaveBeenCalledWith({ componentTypeId: 'ct1' })
  })

  it('lists a directly-mounted candidate with a Mounted pill, excludes retired', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('combobox', { name: /component/i }))
    const mountedOption = await screen.findByRole('option', { name: /Component Two/ })
    expect(mountedOption).toHaveTextContent('Mounted')
    expect(screen.getByRole('option', { name: 'Component One' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Component Three/ })).not.toBeInTheDocument()
  })

  it('adds a directly-mounted component without a dismount side effect', async () => {
    const user = userEvent.setup()
    vi.mocked(assembliesApi.addAssemblyMember).mockResolvedValueOnce({})
    renderDialog()

    await user.click(screen.getByRole('combobox', { name: /component/i }))
    await user.click(await screen.findByRole('option', { name: /Component Two/ }))
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    expect(assembliesApi.addAssemblyMember).toHaveBeenCalledTimes(1)
    const [, body] = vi.mocked(assembliesApi.addAssemblyMember).mock.calls[0]
    expect(body.componentId).toBe('c2')
  })

  it('shows a candidate picker after a 409 UNRESOLVED_SLOTS, then resubmits with the chosen mountPointId', async () => {
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

    renderDialog()

    await pickComponent(user)
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    expect(await screen.findByLabelText(/mount point/i)).toBeInTheDocument()
    expect(assembliesApi.addAssemblyMember).toHaveBeenCalledTimes(1)
    const [, firstBody] = vi.mocked(assembliesApi.addAssemblyMember).mock.calls[0]
    expect(firstBody.mountPointId).toBeUndefined()

    await user.click(screen.getByLabelText(/mount point/i))
    await user.click(await screen.findByRole('option', { name: 'Rear wheel' }))
    await user.click(screen.getByRole('button', { name: /resolve & add/i }))

    expect(assembliesApi.addAssemblyMember).toHaveBeenCalledTimes(2)
    const [, secondBody] = vi.mocked(assembliesApi.addAssemblyMember).mock.calls[1]
    expect(secondBody.mountPointId).toBe('mp2')
    expect(secondBody.slotId).toBe('s1')
  }, 10000)
})
