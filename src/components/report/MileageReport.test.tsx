// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import type { MileageFilters } from '@/api/reports'
import type { MileageItem } from '@/types/api'
import { MileageReport } from './MileageReport'

let capturedFilters: MileageFilters[] = []
vi.mock('@/api/reports', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reports')>()
  return {
    ...actual,
    mileageQuery: (filters: MileageFilters) => {
      capturedFilters.push(filters)
      return {
        queryKey: actual.mileageQueryKey(filters),
        queryFn: async (): Promise<MileageItem[]> => [],
      }
    },
  }
})

vi.mock('@/components/report/TourReport', () => ({
  TourReport: () => <div data-testid="tour-report" />,
}))

const renderReport = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MileageReport />
      </LocalizationProvider>
    </QueryClientProvider>,
  )
}

const lastFilters = () => capturedFilters[capturedFilters.length - 1]

describe('MileageReport time frame', () => {
  beforeEach(() => {
    capturedFilters = []
  })

  it('requests all-time mileage with no from/to by default', () => {
    renderReport()

    expect(lastFilters().from).toBeUndefined()
    expect(lastFilters().to).toBeUndefined()
  })

  it('sets only from (day-start) when just the From date is picked, for "A to now"', async () => {
    const user = userEvent.setup()
    renderReport()

    const fromField = screen.getByLabelText('From', { selector: 'input' })
    await user.type(fromField, '04/22/2026')

    expect(lastFilters().from).toMatch(/^2026-04-22T00:00:00\.000/)
    expect(lastFilters().to).toBeUndefined()
  })

  it('sets from (day-start) and to (day-end) when both dates are picked', async () => {
    const user = userEvent.setup()
    renderReport()

    await user.type(screen.getByLabelText('From', { selector: 'input' }), '04/22/2026')
    await user.type(screen.getByLabelText('To', { selector: 'input' }), '05/01/2026')

    expect(lastFilters().from).toMatch(/^2026-04-22T00:00:00\.000/)
    expect(lastFilters().to).toMatch(/^2026-05-01T23:59:59\.999/)
  })
})

describe('MileageReport tours scope', () => {
  beforeEach(() => {
    capturedFilters = []
  })

  it('switches to the Tours panel, hiding the date pickers and the table', async () => {
    const user = userEvent.setup()
    renderReport()

    await user.click(screen.getByRole('button', { name: 'Tours' }))

    expect(screen.getByTestId('tour-report')).toBeInTheDocument()
    expect(screen.queryByLabelText('From', { selector: 'input' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('To', { selector: 'input' })).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('never calls mileageQuery with scope: tours', async () => {
    const user = userEvent.setup()
    renderReport()

    await user.click(screen.getByRole('button', { name: 'Tours' }))

    expect(capturedFilters.some((f) => (f.scope as string) === 'tours')).toBe(false)
  })
})
