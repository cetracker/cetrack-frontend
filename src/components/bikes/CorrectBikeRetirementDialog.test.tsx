// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotifyProvider } from '@/hooks/NotifyProvider'
import { mountingsRootKey } from '@/api/mountings'
import { CorrectBikeRetirementDialog } from './CorrectBikeRetirementDialog'

vi.mock('@/api/bikes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/bikes')>()
  return {
    ...actual,
    correctBikeRetirement: vi.fn().mockResolvedValue({}),
  }
})

import * as bikesApi from '@/api/bikes'

const renderDialog = (
  qc: QueryClient,
  props: { currentKind?: 'scrapped' | 'other'; currentNote?: string } = {},
) =>
  render(
    <QueryClientProvider client={qc}>
      <NotifyProvider>
        <CorrectBikeRetirementDialog
          open
          onClose={vi.fn()}
          bikeId="b1"
          currentKind={props.currentKind}
          currentNote={props.currentNote}
        />
      </NotifyProvider>
    </QueryClientProvider>,
  )

describe('CorrectBikeRetirementDialog', () => {
  it('a kind-less (legacy) bike starts with an empty selection and a disabled submit', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderDialog(qc, {})

    const zeroWidthSpace = String.fromCharCode(0x200b)
    expect(
      screen
        .getByRole('combobox', { name: /reason/i })
        .textContent?.replaceAll(zeroWidthSpace, '')
        .trim(),
    ).toBe('')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('correcting a reason does not invalidate mounting queries', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    const user = userEvent.setup()
    renderDialog(qc, { currentKind: 'scrapped', currentNote: 'scrapped it' })

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(bikesApi.correctBikeRetirement).toHaveBeenCalledTimes(1)
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey)
    expect(invalidatedKeys).not.toContainEqual(mountingsRootKey)
  })
})
