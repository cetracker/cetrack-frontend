// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { RetireComponentDialog } from './RetireComponentDialog'

vi.mock('@/api/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/components')>()
  return {
    ...actual,
    retireComponent: vi.fn().mockResolvedValue({}),
  }
})

import * as componentsApi from '@/api/components'

const renderDialog = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <RetireComponentDialog open onClose={vi.fn()} componentId="c1" />
        </LocalizationProvider>
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('RetireComponentDialog', () => {
  it('offers all eight retirement reasons', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('combobox', { name: /reason/i }))
    for (const label of ['Scrapped', 'Sold', 'Gifted', 'Broken', 'Lost', 'Stolen', 'Worn out', 'Other']) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
    }
  })

  it('submits the chosen reason and note', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('combobox', { name: /reason/i }))
    await user.click(screen.getByRole('option', { name: 'Broken' }))
    await user.type(screen.getByLabelText(/note/i), 'snapped in half')
    await user.click(screen.getByRole('button', { name: /retire/i }))

    expect(componentsApi.retireComponent).toHaveBeenCalledTimes(1)
    const [id, body] = vi.mocked(componentsApi.retireComponent).mock.calls[0]
    expect(id).toBe('c1')
    expect(body.kind).toBe('broken')
    expect(body.note).toBe('snapped in half')
  })
})
