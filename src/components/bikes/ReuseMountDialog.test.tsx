// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { ReuseMountDialog } from './ReuseMountDialog'

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return { ...actual, mountComponent: vi.fn().mockResolvedValue({}) }
})

import * as bikesApi from '@/api/bikes'

const renderDialog = (
  props: Partial<Parameters<typeof ReuseMountDialog>[0]> = {},
  onClose = vi.fn(),
) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ReuseMountDialog
            open
            onClose={onClose}
            bikeId="b1"
            mountPointId="mp1"
            componentId="c1"
            componentName="Widget"
            {...props}
          />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('ReuseMountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirm calls mountComponent with bikeId, mountPointId, componentId and at', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: /^mount$/i }))

    expect(bikesApi.mountComponent).toHaveBeenCalledTimes(1)
    const [bikeId, mountPointId, body] = vi.mocked(bikesApi.mountComponent).mock.calls[0]
    expect(bikeId).toBe('b1')
    expect(mountPointId).toBe('mp1')
    expect(body.componentId).toBe('c1')
    expect(body.at).toBeTruthy()
  })

  it('shows no dismount warning when the mount point is empty', () => {
    renderDialog({ activeComponentName: undefined })
    expect(screen.queryByText(/will dismount/i)).not.toBeInTheDocument()
  })

  it('shows the dismount warning when the mount point is occupied', () => {
    renderDialog({ activeComponentName: 'Old Part' })
    expect(screen.getByText(/mounting this component will dismount old part/i)).toBeInTheDocument()
  })
})
