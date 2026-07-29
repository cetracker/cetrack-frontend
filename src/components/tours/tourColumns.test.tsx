// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/common/DataTable'
import type { Tour } from '@/types/api'
import { buildColumns } from './tourColumns'

const tour = (id: string, title: string, distance: number, ascent: number): Tour => ({
  id,
  title,
  distance,
  durationMoving: 3600,
  ascent,
  descent: ascent,
  powerTotal: 1_000_000,
  startedAt: '2025-03-10T10:00:00Z',
  startYear: 2025,
  startMonth: 3,
  startDay: 10,
})

const TOURS: Tour[] = [
  tour('1', 'alpine loop', 10_000, 100),
  tour('2', 'river run', 20_000, 200),
  tour('3', 'alpine ridge', 30_000, 300),
]

const Harness = ({ initialFilter = '' }: { initialFilter?: string }) => {
  const { t } = useTranslation()
  const [globalFilter, setGlobalFilter] = useState(initialFilter)
  return (
    <DataTable<Tour>
      columns={buildColumns(t, { onOpenMenu: () => {} })}
      data={TOURS}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      showFooter
    />
  )
}

/** Footer cell texts, in column order: title, year, month, started, distance,
 *  moving, up, down, work, bike, actions. */
const footerCells = () => {
  const rows = screen.getAllByRole('row')
  return within(rows[rows.length - 1])
    .getAllByRole('cell')
    .map((c) => c.textContent ?? '')
}

describe('tour column footers', () => {
  it('sums the whole set when no filter is active', () => {
    render(<Harness />)

    // 60000 m -> "60.0" km, ascent 600, descent 600, 3 MJ -> "3000" kJ
    expect(footerCells()).toEqual([
      '3 tours', '', '', '', '60.0', '3:00:00', '600', '600', '3000', '', '',
    ])
  })

  it('sums only the filtered set when a search is active', () => {
    render(<Harness initialFilter="alpine" />)

    // alpine loop + alpine ridge only
    expect(footerCells()).toEqual([
      '2 tours', '', '', '', '40.0', '2:00:00', '400', '400', '2000', '', '',
    ])
    expect(screen.queryByText('river run')).not.toBeInTheDocument()
  })
})
