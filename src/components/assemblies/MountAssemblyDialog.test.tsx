// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Assembly, MountPlan } from '@/types/api'
import { MountAssemblyDialog } from './MountAssemblyDialog'

vi.mock('@/api/assemblies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/assemblies')>()
  return { ...actual, planMountAssembly: vi.fn(), mountAssembly: vi.fn() }
})

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({
      queryKey: actual.bikesQueryKey,
      queryFn: async () => [{ id: 'b1', name: 'Bike One' }],
    }),
    mountPointsQuery: (bikeId: string) => ({
      queryKey: actual.mountPointsQueryKey(bikeId),
      queryFn: async () => [
        { id: 'mp1', bikeId, name: 'Frame mount', componentTypeId: 'ct1', mandatory: false },
        { id: 'mp2', bikeId, name: 'Front wheel', componentTypeId: 'ct2', mandatory: false },
        { id: 'mp3', bikeId, name: 'Rear wheel', componentTypeId: 'ct2', mandatory: false },
      ],
    }),
  }
})

vi.mock('@/api/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/components')>()
  return {
    ...actual,
    componentsQuery: () => ({
      queryKey: actual.componentsQueryKey(),
      queryFn: async () => [],
    }),
  }
})

import * as assembliesApi from '@/api/assemblies'

const assembly: Assembly = {
  id: 'a1',
  name: 'Test Assembly',
  complete: true,
  mounted: false,
  slots: [
    { id: 's1', name: 'Frame', componentTypeId: 'ct1', validFrom: '2026-01-01T00:00:00Z' },
    { id: 's2', name: 'Wheel', componentTypeId: 'ct2', validFrom: '2026-01-01T00:00:00Z' },
  ],
}

const renderDialog = (onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MountAssemblyDialog open onClose={onClose} assembly={assembly} />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

const pickBikeAndNext = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('combobox', { name: /bike/i }))
  await user.click(await screen.findByRole('option', { name: 'Bike One' }))
  await user.click(screen.getByRole('button', { name: /next/i }))
}

describe('MountAssemblyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("plans, then mounts with the user's answer for the unresolved slot", async () => {
    const user = userEvent.setup()
    const plan: MountPlan = {
      assemblyId: 'a1',
      bikeId: 'b1',
      at: '2026-01-01T00:00:00Z',
      mountable: false,
      slots: [
        { slotId: 's1', state: 'resolved', mountPointId: 'mp1', resolvedBy: 'uniqueCandidate' },
        {
          slotId: 's2',
          state: 'unresolved',
          candidates: [
            { mountPointId: 'mp2', mountPointName: 'Front wheel' },
            { mountPointId: 'mp3', mountPointName: 'Rear wheel' },
          ],
        },
      ],
    }
    vi.mocked(assembliesApi.planMountAssembly).mockResolvedValue(plan)
    vi.mocked(assembliesApi.mountAssembly).mockResolvedValue({
      assemblyMounting: {
        id: 'am1',
        assemblyId: 'a1',
        bikeId: 'b1',
        mountedAt: '2026-01-01T00:00:00Z',
      },
      changes: {},
    })

    renderDialog()

    await pickBikeAndNext(user)

    expect(assembliesApi.planMountAssembly).toHaveBeenCalledTimes(1)
    const [planAssemblyId, planBody] = vi.mocked(assembliesApi.planMountAssembly).mock.calls[0]
    expect(planAssemblyId).toBe('a1')
    expect(planBody.bikeId).toBe('b1')

    await user.click(await screen.findByRole('radio', { name: 'Rear wheel' }))
    await user.click(screen.getByRole('button', { name: /^mount$/i }))

    expect(assembliesApi.mountAssembly).toHaveBeenCalledTimes(1)
    const [mountAssemblyId, mountBody] = vi.mocked(assembliesApi.mountAssembly).mock.calls[0]
    expect(mountAssemblyId).toBe('a1')
    expect(mountBody.bikeId).toBe('b1')
    expect(mountBody.slotResolutions).toEqual([{ slotId: 's2', mountPointId: 'mp3' }])
  }, 10000)

  it('an impossible slot blocks submission', async () => {
    const user = userEvent.setup()
    const plan: MountPlan = {
      assemblyId: 'a1',
      bikeId: 'b1',
      at: '2026-01-01T00:00:00Z',
      mountable: false,
      slots: [
        {
          slotId: 's1',
          state: 'impossible',
          reasonCode: 'noCandidate',
          reason: 'No candidate mount point for this slot',
        },
      ],
    }
    vi.mocked(assembliesApi.planMountAssembly).mockResolvedValue(plan)

    renderDialog()
    await pickBikeAndNext(user)

    expect(await screen.findByText(/no candidate mount point for this slot/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^mount$/i })).toBeDisabled()
    expect(assembliesApi.mountAssembly).not.toHaveBeenCalled()
  })

  it('an empty slot also blocks submission', async () => {
    const user = userEvent.setup()
    const plan: MountPlan = {
      assemblyId: 'a1',
      bikeId: 'b1',
      at: '2026-01-01T00:00:00Z',
      mountable: false,
      slots: [{ slotId: 's1', state: 'empty' }],
    }
    vi.mocked(assembliesApi.planMountAssembly).mockResolvedValue(plan)

    renderDialog()
    await pickBikeAndNext(user)

    expect(await screen.findByText(/empty, add a member first/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^mount$/i })).toBeDisabled()
    expect(assembliesApi.mountAssembly).not.toHaveBeenCalled()
  })
})
