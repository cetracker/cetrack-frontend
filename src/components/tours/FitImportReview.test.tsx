// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FitImportReview } from './FitImportReview'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import type { Bike, FitDraftTour } from '@/types/api'
import { ApiException } from '@/api/client'

vi.mock('@/api/tours', () => ({
  createTour: vi.fn(),
  toursQueryKey: ['tours'],
}))

vi.mock('@/components/common/BikeSelect', () => ({
  BikeSelect: ({
    onChange,
    value,
  }: {
    onChange: (id: string | null) => void
    value: string | null | undefined
  }) => (
    <select
      aria-label="Bike"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">— None —</option>
      <option value="bike-1">Specialized Tarmac</option>
    </select>
  ),
  FROM_FILE: '__from_file__',
}))

import * as toursApi from '@/api/tours'

const mockBike: Bike = { id: 'bike-1', model: 'Tarmac', manufacturer: 'Specialized' }

const makeDraft = (overrides: Partial<FitDraftTour> = {}): FitDraftTour => ({
  title: null,
  bike: null,
  distance: 50000,
  durationMoving: 7200,
  durationRecorded: 7300,
  durationElapsed: 7400,
  altUp: 500,
  altDown: 500,
  powerTotal: 1000000,
  startedAt: '2026-06-26T08:00:00Z',
  startYear: 2026,
  startMonth: 6,
  startDay: 26,
  ...overrides,
})

const renderComponent = (drafts: FitDraftTour[]) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  qc.setQueryData(['bikes'], [mockBike])
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <FitImportReview drafts={drafts} />
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('FitImportReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables Create when no bike is selected', () => {
    renderComponent([makeDraft()])
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()
  })

  it('disables Create when title is cleared', async () => {
    renderComponent([makeDraft()])
    const titleInput = screen.getByRole('textbox', { name: /title/i })
    await userEvent.clear(titleInput)
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled()
  })

  it('enables Create when title and bike are both set', async () => {
    renderComponent([makeDraft()])
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /bike/i }), 'bike-1')
    expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled()
  })

  it('renders duplicate warning when duplicateHint is present', () => {
    const draft = makeDraft({
      duplicateHint: {
        matchedTours: [
          {
            tourId: 'existing-1',
            title: 'Old Ride',
            startedAt: '2026-06-26T08:00:00Z',
            distance: 50000,
            durationMoving: 7200,
            bikeId: 'bike-1',
          },
        ],
      },
    })
    renderComponent([draft])
    expect(screen.getByText(/possible duplicate/i)).toBeInTheDocument()
    expect(screen.getByText(/old ride/i)).toBeInTheDocument()
  })

  it('shows inline 409 error and keeps card editable', async () => {
    vi.mocked(toursApi.createTour).mockRejectedValue(
      new ApiException({ status: 409, message: 'TOUR_DUPLICATE' }),
    )
    renderComponent([makeDraft()])
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /bike/i }), 'bike-1')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('textbox', { name: /title/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /create/i })).not.toBeDisabled()
  })

  it('shows success state after creation', async () => {
    vi.mocked(toursApi.createTour).mockResolvedValue({
      id: 'new-tour-1',
      title: 'Test',
      distance: 50000,
      durationMoving: 7200,
      altUp: 500,
      altDown: 500,
      powerTotal: 1000000,
      startedAt: '2026-06-26T08:00:00Z',
      startYear: 2026,
      startMonth: 6,
      startDay: 26,
    })
    renderComponent([makeDraft()])
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /bike/i }), 'bike-1')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/✓ Created/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /create/i })).not.toBeInTheDocument()
  })
})
