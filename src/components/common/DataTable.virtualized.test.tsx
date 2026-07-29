// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ColumnDef, GroupingState } from '@tanstack/react-table'
import { useState } from 'react'
import { DataTable } from './DataTable'

// jsdom lays nothing out: every element reports zero size and there is no
// ResizeObserver, which is exactly why `canVirtualize` feature-detects. These
// stubs are file-local — a global stub would change how every other suite
// renders (the CE-0123 class of flakiness).
const ROW_HEIGHT = 40
const VIEWPORT_HEIGHT = 400

let originalResizeObserver: unknown

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.tagName === 'TR' ? ROW_HEIGHT : VIEWPORT_HEIGHT
    },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 800,
  })
  // virtual-core reads scrollElement.ownerDocument.defaultView.ResizeObserver,
  // and in vitest's jsdom env `globalThis.X = …` does not create `window.X`.
  originalResizeObserver = window.ResizeObserver
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetHeight')
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth')
  window.ResizeObserver = originalResizeObserver as typeof ResizeObserver
})

interface Row {
  title: string
  startYear: number
  distance: number
}

const ROWS: Row[] = Array.from({ length: 500 }, (_, i) => ({
  title: `tour ${i}`,
  startYear: 2020 + (i % 5),
  distance: i * 100,
}))

const COLUMNS: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'title', header: 'Title', enableGrouping: false, size: 240 },
  { accessorKey: 'startYear', header: 'Year', enableGrouping: true, size: 80 },
  { accessorKey: 'distance', header: 'Distance', enableGrouping: false, size: 120 },
]

const Harness = ({ initialGrouping = [] }: { initialGrouping?: GroupingState }) => {
  const [grouping, setGrouping] = useState<GroupingState>(initialGrouping)
  return (
    <DataTable<Row>
      columns={COLUMNS}
      data={ROWS}
      grouping={grouping}
      onGroupingChange={setGrouping}
      enableGrouping
      virtualized
    />
  )
}

/** aria-hidden spacer rows carry no role, so this counts real rows only. */
const renderedRows = () => screen.getAllByRole('row')

const cellContaining = (label: string) =>
  screen.getAllByRole('cell').find((c) => c.textContent?.includes(label))!

describe('DataTable virtualization', () => {
  it('renders only a window of rows for a large data set', () => {
    render(<Harness />)

    // 500 rows in, far fewer in the DOM: viewport + overscan, plus the header.
    const rows = renderedRows()
    expect(rows.length).toBeGreaterThan(1)
    expect(rows.length).toBeLessThan(100)

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('tour 0')).toBeInTheDocument()
  })

  it('stays bounded when a group is expanded', () => {
    render(<Harness initialGrouping={['startYear']} />)

    const collapsed = renderedRows().map((r) => r.textContent)
    // 5 year groups + header — everything fits, nothing is windowed away yet.
    expect(collapsed).toHaveLength(6)

    fireEvent.click(cellContaining('2020'))

    const expanded = renderedRows()
    expect(expanded.length).toBeGreaterThan(collapsed.length)
    expect(expanded.length).toBeLessThan(100)
    expect(expanded.map((r) => r.textContent)).not.toEqual(collapsed)
  })
})
