// @vitest-environment jsdom
import type { ComponentProps } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { MaintenanceTaskForm } from './MaintenanceTaskForm'

vi.mock('@/api/maintenance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/maintenance')>()
  return {
    ...actual,
    createMaintenanceTask: vi.fn().mockResolvedValue({}),
    updateMaintenanceTask: vi.fn().mockResolvedValue({}),
  }
})

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    bikesQuery: () => ({
      queryKey: actual.bikesQueryKey,
      queryFn: async () => [
        { id: 'b1', name: 'Bike One' },
        { id: 'b2', name: 'Bike Two' },
      ],
    }),
  }
})

import * as maintenanceApi from '@/api/maintenance'

const renderForm = (props: Partial<ComponentProps<typeof MaintenanceTaskForm>> = {}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MaintenanceTaskForm open onClose={vi.fn()} {...props} />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

const fillName = async (user: ReturnType<typeof userEvent.setup>, name = 'Chain wax') => {
  const field = screen.getByLabelText(/^name/i)
  await user.clear(field)
  await user.type(field, name)
}

const submit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^save$/i }))
}

describe('MaintenanceTaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a task with no interval client-side', async () => {
    const user = userEvent.setup()
    renderForm({ fixedBikeId: 'b1' })

    await fillName(user)
    await submit(user)

    expect(
      await screen.findByText('Set a distance or a time interval (or both)'),
    ).toBeInTheDocument()
    expect(maintenanceApi.createMaintenanceTask).not.toHaveBeenCalled()
  })

  it('converts km and days to meters and seconds on the wire', async () => {
    const user = userEvent.setup()
    renderForm({ fixedBikeId: 'b1' })

    await fillName(user)
    await user.type(screen.getByLabelText(/distance interval/i), '800')
    await user.type(screen.getByLabelText(/time interval/i), '90')
    await submit(user)

    expect(maintenanceApi.createMaintenanceTask).toHaveBeenCalledTimes(1)
    const [payload] = vi.mocked(maintenanceApi.createMaintenanceTask).mock.calls[0]
    expect(payload).toEqual({
      bikeId: 'b1',
      name: 'Chain wax',
      distanceInterval: 800_000,
      timeInterval: 7_776_000,
    })
  })

  it('omits timeInterval when only distance is set', async () => {
    const user = userEvent.setup()
    renderForm({ fixedBikeId: 'b1' })

    await fillName(user)
    await user.type(screen.getByLabelText(/distance interval/i), '800')
    await submit(user)

    expect(maintenanceApi.createMaintenanceTask).toHaveBeenCalledTimes(1)
    const [payload] = vi.mocked(maintenanceApi.createMaintenanceTask).mock.calls[0]
    expect(payload).not.toHaveProperty('timeInterval')
    expect(payload).toEqual({ bikeId: 'b1', name: 'Chain wax', distanceInterval: 800_000 })
  })

  it('rejects a sub-unit interval that rounds to zero on the wire', async () => {
    const user = userEvent.setup()
    renderForm({ fixedBikeId: 'b1' })

    await fillName(user)
    await user.type(screen.getByLabelText(/distance interval/i), '0.0004')
    await submit(user)

    expect(await screen.findByText('Too small at this precision')).toBeInTheDocument()
    expect(maintenanceApi.createMaintenanceTask).not.toHaveBeenCalled()
  })

  it('locks the bike field when fixedBikeId is set, and submits that bikeId', async () => {
    const user = userEvent.setup()
    renderForm({ fixedBikeId: 'b1' })

    expect(await screen.findByLabelText(/^bike$/i)).toBeDisabled()

    await fillName(user)
    await user.type(screen.getByLabelText(/distance interval/i), '800')
    await submit(user)

    const [payload] = vi.mocked(maintenanceApi.createMaintenanceTask).mock.calls[0]
    expect(payload.bikeId).toBe('b1')
  })
})
