// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Component, MountPoint } from '@/types/api'
import { MountDialog } from './MountDialog'

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

const mountPoint: MountPoint = {
  id: 'mp1',
  bikeId: 'b1',
  name: 'Front wheel',
  componentTypeId: 'ct1',
  mandatory: false,
}

const renderDialog = (onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <MountDialog open onClose={onClose} bikeId="b1" mountPoint={mountPoint} />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('MountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    componentsData = [
      { id: 'c1', componentTypeId: 'ct1', label: 'Comp A', status: 'inStock' },
    ]
  })

  it('does not show the "Previously used here" pills', () => {
    renderDialog()
    expect(screen.queryByText(/previously used here/i)).not.toBeInTheDocument()
  })
})
