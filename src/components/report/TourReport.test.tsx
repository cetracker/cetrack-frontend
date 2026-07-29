// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { TourReportFilters } from '@/api/reports'
import type { TourReport as TourReportData } from '@/types/api'
import { TourReport } from './TourReport'

// x-charts skips rendering in jsdom's 0-size containers, and no case here
// needs a real chart - mocked so this file stays focused on TourReport's own
// state/query wiring.
vi.mock('./TourReportChart', () => ({
  TourReportChart: () => null,
}))

let capturedFilters: TourReportFilters[] = []
let mockReport: TourReportData = { availableYears: [2025, 2024], bikes: [], buckets: [] }

vi.mock('@/api/reports', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reports')>()
  return {
    ...actual,
    tourReportQuery: (filters: TourReportFilters) => {
      capturedFilters.push(filters)
      return {
        queryKey: actual.tourReportQueryKey(filters),
        queryFn: async (): Promise<TourReportData> => mockReport,
      }
    },
  }
})

const renderReport = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <TourReport />
    </QueryClientProvider>,
  )
}

const lastFilters = () => capturedFilters[capturedFilters.length - 1]

describe('TourReport', () => {
  beforeEach(() => {
    capturedFilters = []
    mockReport = { availableYears: [2025, 2024], bikes: [], buckets: [] }
  })

  it('requests month granularity, no endYear, yearsBack 1 by default', () => {
    renderReport()

    expect(lastFilters()).toEqual({ granularity: 'month', endYear: undefined, yearsBack: 1 })
  })

  it('does not change query args when only the metric changes', async () => {
    const user = userEvent.setup()
    renderReport()
    const before = lastFilters()

    await user.click(screen.getByLabelText('Metric'))
    await user.click(await screen.findByRole('option', { name: 'Elevation gain' }))

    expect(lastFilters()).toEqual(before)
  })

  it('refetches when granularity changes', async () => {
    const user = userEvent.setup()
    renderReport()

    await user.click(screen.getByLabelText('Granularity'))
    await user.click(await screen.findByRole('option', { name: 'Year' }))

    expect(lastFilters().granularity).toBe('year')
  })

  it('refetches when yearsBack changes', async () => {
    const user = userEvent.setup()
    renderReport()

    await user.click(screen.getByLabelText('Years back'))
    await user.click(await screen.findByRole('option', { name: '5' }))

    expect(lastFilters().yearsBack).toBe(5)
  })

  it('populates end-year options from the fetched availableYears', async () => {
    renderReport()

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'End year' })).toHaveTextContent('2025'),
    )
  })

  it('shows the empty state when availableYears is empty', async () => {
    mockReport = { availableYears: [], bikes: [], buckets: [] }
    renderReport()

    expect(await screen.findByText('No tours recorded yet')).toBeInTheDocument()
  })
})
