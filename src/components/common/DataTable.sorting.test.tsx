// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef, GroupingState, SortingState } from '@tanstack/react-table'
import { useState } from 'react'
import { DataTable } from './DataTable'

interface Row {
  title: string
  startYear: number
  startMonth: number
  startedAt: string
}

// Insertion order of the year groups is 2025, 2023, 2024 — deliberately not the
// sorted order, so a test that passes cannot be passing by accident.
const ROWS: Row[] = [
  { title: 'a', startYear: 2025, startMonth: 3, startedAt: '2025-03-10T10:00:00Z' },
  { title: 'b', startYear: 2023, startMonth: 1, startedAt: '2023-01-05T10:00:00Z' },
  { title: 'c', startYear: 2024, startMonth: 2, startedAt: '2024-02-07T10:00:00Z' },
  { title: 'd', startYear: 2025, startMonth: 1, startedAt: '2025-01-20T10:00:00Z' },
  { title: 'e', startYear: 2025, startMonth: 1, startedAt: '2025-01-25T10:00:00Z' },
]

const COLUMNS: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'title', header: 'Title', enableGrouping: false },
  { accessorKey: 'startYear', header: 'Year', enableGrouping: true },
  { accessorKey: 'startMonth', header: 'Month', enableGrouping: true },
  { accessorKey: 'startedAt', header: 'Started', enableGrouping: false },
]

interface HarnessProps {
  initialGrouping?: GroupingState
  initialSorting?: SortingState
}

const Harness = ({
  initialGrouping = [],
  initialSorting = [{ id: 'startedAt', desc: true }],
}: HarnessProps) => {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [grouping, setGrouping] = useState<GroupingState>(initialGrouping)
  return (
    <>
      <button type="button" onClick={() => setGrouping([])}>
        ungroup
      </button>
      <div data-testid="sorting">{JSON.stringify(sorting)}</div>
      <DataTable<Row>
        columns={COLUMNS}
        data={ROWS}
        sorting={sorting}
        onSortingChange={setSorting}
        grouping={grouping}
        onGroupingChange={setGrouping}
        enableGrouping
      />
    </>
  )
}

/** Text of the collapsed/expanded group header rows, in render order. */
const groupRowTexts = () =>
  screen
    .getAllByRole('row')
    .map((r) => r.textContent ?? '')
    .filter((t) => t.includes('▶') || t.includes('▼'))

const cellContaining = (label: string) =>
  screen.getAllByRole('cell').find((c) => c.textContent?.includes(label))!

const sortingState = (): SortingState =>
  JSON.parse(screen.getByTestId('sorting').textContent ?? '[]')

const clickHeader = (name: string, opts: { shiftKey?: boolean } = {}) =>
  fireEvent.click(screen.getByText(name), opts)

describe('DataTable sorting under grouping', () => {
  it('orders year groups ascending even though the sort is on another column', () => {
    render(<Harness initialGrouping={['startYear']} />)

    const years = groupRowTexts().map((t) => t.match(/\d{4}/)?.[0])
    expect(years).toEqual(['2023', '2024', '2025'])
  })

  it('keeps the leaf sort applied inside a group', () => {
    render(<Harness initialGrouping={['startYear']} />)

    fireEvent.click(cellContaining('2025'))

    // Started desc within 2025: a (Mar 10), e (Jan 25), d (Jan 20)
    const leafTitles = screen
      .getAllByRole('row')
      .map((r) => r.textContent ?? '')
      .filter((t) => !t.includes('▶') && !t.includes('▼') && /2025-/.test(t))
      .map((t) => t.charAt(0))
    expect(leafTitles).toEqual(['a', 'e', 'd'])
  })

  it('reverses only the group order when a grouped header is clicked, preserving the other sort', () => {
    render(<Harness initialGrouping={['startYear']} />)

    clickHeader('Year')

    expect(groupRowTexts().map((t) => t.match(/\d{4}/)?.[0])).toEqual([
      '2025',
      '2024',
      '2023',
    ])
    // The Started sort must survive — this is the regression that broke before.
    expect(sortingState()).toEqual([{ id: 'startedAt', desc: true }])
  })

  it('nests month groups chronologically inside year groups', () => {
    render(<Harness initialGrouping={['startYear', 'startMonth']} />)

    fireEvent.click(cellContaining('2025'))

    const months = groupRowTexts()
      .filter((t) => !/\d{4}/.test(t))
      .map((t) => t.replace(/[▶▼\s]/g, ''))
    expect(months).toEqual(['1(2)', '3(1)'])
  })

  it('appends a sort level on shift+click and ranks both headers', () => {
    render(<Harness initialSorting={[]} />)

    clickHeader('Title')
    clickHeader('Started', { shiftKey: true })

    expect(sortingState()).toEqual([
      { id: 'title', desc: false },
      { id: 'startedAt', desc: false },
    ])
    expect(screen.getByText('Title').parentElement?.textContent).toContain('1')
    expect(screen.getByText('Started').parentElement?.textContent).toContain('2')
  })

  it('leaves no stale grouped key in the sort state after ungrouping', () => {
    render(<Harness initialGrouping={['startYear']} />)

    clickHeader('Year')
    fireEvent.click(screen.getByRole('button', { name: 'ungroup' }))

    expect(sortingState().some((s) => s.id === 'startYear')).toBe(false)
    expect(sortingState()).toEqual([{ id: 'startedAt', desc: true }])
  })
})
