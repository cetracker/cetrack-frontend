// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { CorrectComponentRetirementDialog } from './CorrectComponentRetirementDialog'

vi.mock('@/api/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/components')>()
  return {
    ...actual,
    correctComponentRetirement: vi.fn().mockResolvedValue({}),
  }
})

import * as componentsApi from '@/api/components'

const renderDialog = (props: {
  currentKind?: 'scrapped' | 'sold' | 'gifted' | 'broken' | 'lost' | 'stolen' | 'wornOut' | 'other'
  currentNote?: string
}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <CorrectComponentRetirementDialog
          open
          onClose={vi.fn()}
          componentId="c1"
          currentKind={props.currentKind}
          currentNote={props.currentNote}
        />
      </NotifyProvider>
    </QueryClientProvider>,
  )
}

describe('CorrectComponentRetirementDialog', () => {
  it('seeds the reason and note from current values before any interaction', () => {
    renderDialog({ currentKind: 'sold', currentNote: 'sold to Jan' })

    expect(screen.getByRole('combobox', { name: /reason/i })).toHaveTextContent('Sold')
    expect(screen.getByLabelText(/note/i)).toHaveValue('sold to Jan')
  })

  it('changing only the reason still submits the original note (destructive-path guard)', async () => {
    const user = userEvent.setup()
    renderDialog({ currentKind: 'sold', currentNote: 'sold to Jan' })

    await user.click(screen.getByRole('combobox', { name: /reason/i }))
    await user.click(screen.getByRole('option', { name: 'Gifted' }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(componentsApi.correctComponentRetirement).toHaveBeenCalledTimes(1)
    const [id, body] = vi.mocked(componentsApi.correctComponentRetirement).mock.calls[0]
    expect(id).toBe('c1')
    expect(body).toEqual({ kind: 'gifted', note: 'sold to Jan' })
  })

  it('a kind-less (legacy) component starts with an empty selection and a disabled submit', () => {
    renderDialog({})

    const zeroWidthSpace = String.fromCharCode(0x200b)
    expect(
      screen
        .getByRole('combobox', { name: /reason/i })
        .textContent?.replaceAll(zeroWidthSpace, '')
        .trim(),
    ).toBe('')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })
})
