import { useMemo, useState, type ReactNode, type Ref } from 'react'
import {
  Box,
  Alert,
  Button,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import FilterListIcon from '@mui/icons-material/FilterList'
import WorkspacesIcon from '@mui/icons-material/Workspaces'
import { useTranslation } from 'react-i18next'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type GroupingState,
  type OnChangeFn,
  type Row,
  type RowData,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

declare module '@tanstack/react-table' {
  // Generic parameter names must stay aligned with upstream declaration.
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right'
    hideOnMobile?: boolean
  }
}

const SKELETON_ROW_KEYS = ['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'] as const

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  error?: { message: string } | null
  onRetry?: () => void
  onRowClick?: (row: TData) => void
  emptyMessage?: string

  // Controlled state (parent owns to preserve across drawer open/close)
  globalFilter?: string
  onGlobalFilterChange?: OnChangeFn<string>
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  grouping?: GroupingState
  onGroupingChange?: OnChangeFn<GroupingState>
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>

  enableGrouping?: boolean
  enableColumnFilters?: boolean
  enableGlobalFilter?: boolean
  showFooter?: boolean
  stickyHeader?: boolean
  maxHeight?: number | string
  fillHeight?: boolean
  title?: ReactNode
  toolbarExtras?: ReactNode
  /** Render only the rows near the viewport. Requires explicit column sizes. */
  virtualized?: boolean
}

export function DataTable<TData>(props: Readonly<DataTableProps<TData>>) {
  const { t } = useTranslation()
  const {
    columns,
    data,
    isLoading,
    error,
    onRetry,
    onRowClick,
    emptyMessage,
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    sorting,
    onSortingChange,
    grouping,
    onGroupingChange,
    columnVisibility,
    onColumnVisibilityChange,
    enableGrouping = false,
    enableColumnFilters = false,
    enableGlobalFilter = true,
    showFooter = false,
    stickyHeader = true,
    maxHeight = 'calc(100vh - 200px)',
    fillHeight = false,
    title,
    toolbarExtras,
    virtualized = false,
  } = props

  // jsdom has no ResizeObserver, so tests render every row exactly as before —
  // no global stubs, no cross-file flakiness.
  const canVirtualize = virtualized && typeof ResizeObserver !== 'undefined'

  // A callback ref, not useRef: the virtualizer's layout effect lives in the
  // descendant VirtualRows, and React attaches host refs bottom-up, so a plain
  // ref on the ancestor TableContainer is still null when that effect runs.
  // The state update on mount forces the second render the virtualizer needs.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)

  const [showFilters, setShowFilters] = useState(false)
  const [colMenuEl, setColMenuEl] = useState<HTMLElement | null>(null)
  const [groupMenuEl, setGroupMenuEl] = useState<HTMLElement | null>(null)

  const [internalGlobalFilter, setInternalGlobalFilter] = useState('')
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([])
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  // Sort direction per grouped column. Grouping owns the outer sort order, so
  // this lives here next to the grouping picker rather than in the parent.
  const [groupSortDesc, setGroupSortDesc] = useState<Record<string, boolean>>({})
  const [internalGrouping, setInternalGrouping] = useState<GroupingState>([])
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({})

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const mobileHiddenOverrides = useMemo<VisibilityState>(() => {
    if (!isMobile) return {}
    const overrides: VisibilityState = {}
    for (const col of columns) {
      if (col.meta?.hideOnMobile) {
        const key = (col as ColumnDef<TData, unknown> & { accessorKey?: string }).accessorKey ?? col.id
        if (key) overrides[key] = false
      }
    }
    return overrides
  }, [isMobile, columns])

  const activeGrouping = grouping ?? internalGrouping

  const effectiveColumnVisibility = useMemo<VisibilityState>(() => {
    // Grouped columns must always be visible regardless of other overrides
    const groupingForced = Object.fromEntries(activeGrouping.map((id) => [id, true]))
    return {
      ...mobileHiddenOverrides,
      ...(columnVisibility ?? internalColumnVisibility),
      ...groupingForced,
    }
  }, [mobileHiddenOverrides, columnVisibility, internalColumnVisibility, activeGrouping])

  // Grouping implies ordering: grouped columns are always the outer sort keys,
  // in grouping order, and the user's column sort applies inside the innermost
  // group. Without this, group rows sort on an undefined aggregate and keep
  // their raw insertion order.
  const userSorting = sorting ?? internalSorting
  const effectiveSorting = useMemo<SortingState>(
    () => [
      ...activeGrouping.map((id) => ({ id, desc: groupSortDesc[id] ?? false })),
      ...userSorting.filter((s) => !activeGrouping.includes(s.id)),
    ],
    [activeGrouping, groupSortDesc, userSorting],
  )

  // The table's sorting handlers derive the next state from `state.sorting`,
  // which now carries the grouped keys. Strip them again on write-back so they
  // never leak into the parent's state and linger after ungrouping.
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === 'function' ? updater(effectiveSorting) : updater
    ;(onSortingChange ?? setInternalSorting)(
      next.filter((s) => !activeGrouping.includes(s.id)),
    )
  }

  const toggleGroupSort = (columnId: string) =>
    setGroupSortDesc((d) => ({ ...d, [columnId]: !(d[columnId] ?? false) }))

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter: globalFilter ?? internalGlobalFilter,
      columnFilters: columnFilters ?? internalColumnFilters,
      sorting: effectiveSorting,
      grouping: grouping ?? internalGrouping,
      columnVisibility: effectiveColumnVisibility,
    },
    onGlobalFilterChange: onGlobalFilterChange ?? setInternalGlobalFilter,
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    onSortingChange: handleSortingChange,
    onGroupingChange: onGroupingChange ?? setInternalGrouping,
    onColumnVisibilityChange:
      onColumnVisibilityChange ?? setInternalColumnVisibility,
    enableGrouping,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: enableGrouping ? getExpandedRowModel() : undefined,
    autoResetExpanded: false,
  })

  const groupableCols = useMemo(
    () => table.getAllLeafColumns().filter((c) => c.getCanGroup()),
    [table],
  )

  const rows = table.getRowModel().rows
  const hasAnyFooter = useMemo(
    () => showFooter && columns.some((c) => c.footer !== undefined),
    [columns, showFooter],
  )

  const renderRow = (
    row: Row<TData>,
    index: number,
    measureRef?: Ref<HTMLTableRowElement>,
  ) => {
    const isGroup = row.getIsGrouped()
    return (
      <TableRow
        key={row.id}
        ref={measureRef}
        data-index={measureRef ? index : undefined}
        hover={!!onRowClick && !isGroup}
        onClick={
          onRowClick && !isGroup ? () => onRowClick(row.original) : undefined
        }
        sx={{
          cursor: onRowClick && !isGroup ? 'pointer' : 'default',
          // One expression rather than `&:nth-of-type(odd)`: with spacer rows in
          // the DOM, position no longer tracks row index. It also lets a group
          // header keep its own colour, which the nth-of-type rule used to win.
          bgcolor: isGroup
            ? theme.palette.action.selected
            : index % 2 === 0
              ? theme.palette.action.hover
              : undefined,
        }}
      >
        {row.getVisibleCells().map((cell) => {
          const align = cell.column.columnDef.meta?.align ?? 'left'
          if (cell.getIsGrouped()) {
            return (
              <TableCell
                key={cell.id}
                align={align}
                onClick={(e) => {
                  e.stopPropagation()
                  row.getToggleExpandedHandler()()
                }}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              >
                {row.getIsExpanded() ? '▼ ' : '▶ '}
                {flexRender(cell.column.columnDef.cell, cell.getContext())}{' '}
                ({row.subRows.length})
              </TableCell>
            )
          }
          if (cell.getIsAggregated()) {
            return (
              <TableCell key={cell.id} align={align}>
                {flexRender(
                  cell.column.columnDef.aggregatedCell ??
                    cell.column.columnDef.cell,
                  cell.getContext(),
                )}
              </TableCell>
            )
          }
          if (cell.getIsPlaceholder()) {
            return <TableCell key={cell.id} align={align} />
          }
          return (
            <TableCell key={cell.id} align={align}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          )
        })}
      </TableRow>
    )
  }

  return (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        ...(fillHeight && { flexGrow: 1, minHeight: 0 }),
      }}
    >
       <Stack
         sx={{ flexDirection: 'row', gap: 1, alignItems: 'center', px: 2, py: 1.5, flexWrap: 'wrap' }}
       >
        {title && (
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        )}
        {!title && <Box sx={{ flexGrow: 1 }} />}

        {enableGlobalFilter && onGlobalFilterChange && (
          <TextField
            value={globalFilter ?? ''}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            placeholder={t('common.search')}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: 200 }}
          />
        )}
        {enableColumnFilters && (
          <Tooltip title={showFilters ? t('common.hideFilters') : t('common.showFilters')}>
            <IconButton onClick={() => setShowFilters((v) => !v)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
        {enableGrouping && onGroupingChange && (
          <>
            <Tooltip title={t('common.grouping')}>
              <IconButton onClick={(e) => setGroupMenuEl(e.currentTarget)}>
                <WorkspacesIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={groupMenuEl}
              open={!!groupMenuEl}
              onClose={() => setGroupMenuEl(null)}
            >
              {groupableCols.length === 0 && (
                <MenuItem disabled>{t('common.noGroupableColumns')}</MenuItem>
              )}
              {groupableCols.map((col) => (
                <MenuItem key={col.id} onClick={() => col.toggleGrouping()}>
                  <Checkbox checked={col.getIsGrouped()} size="small" />
                  <ListItemText
                    primary={
                      typeof col.columnDef.header === 'string'
                        ? col.columnDef.header
                        : col.id
                    }
                  />
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        <Tooltip title={t('common.columns')}>
          <IconButton onClick={(e) => setColMenuEl(e.currentTarget)}>
            <ViewColumnIcon />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={colMenuEl}
          open={!!colMenuEl}
          onClose={() => setColMenuEl(null)}
        >
          {table.getAllLeafColumns().map((col) => (
            <MenuItem key={col.id} onClick={() => col.toggleVisibility()}>
              <Checkbox checked={col.getIsVisible()} size="small" />
              <ListItemText
                primary={
                  typeof col.columnDef.header === 'string'
                    ? col.columnDef.header
                    : col.id
                }
              />
            </MenuItem>
          ))}
        </Menu>
        {toolbarExtras}
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mx: 2, mb: 1 }}
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            ) : undefined
          }
        >
          {error.message}
        </Alert>
      )}

      <TableContainer
        ref={virtualized ? setScrollEl : undefined}
        sx={fillHeight ? { flexGrow: 1, minHeight: 0, overflow: 'auto' } : { maxHeight }}
      >
        <Table
          size="small"
          stickyHeader={stickyHeader}
          sx={
            virtualized
              ? {
                  tableLayout: 'fixed',
                  width: '100%',
                  minWidth: table.getTotalSize(),
                }
              : undefined
          }
        >
          {virtualized && (
            <colgroup>
              {table.getVisibleLeafColumns().map((col) => (
                <col key={col.id} style={{ width: col.getSize() }} />
              ))}
            </colgroup>
          )}
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const dir = header.column.getIsSorted()
                  const isGrouped = header.column.getIsGrouped()
                  const sortIndex = header.column.getSortIndex()
                  const align =
                    header.column.columnDef.meta?.align ?? 'left'
                  return (
                    <TableCell
                      key={header.id}
                      align={align}
                      // With fixed column widths a nowrap header overflows into
                      // its neighbour; the header is outside the virtual window,
                      // so wrapping to two lines costs no row-height constancy.
                      sx={{ whiteSpace: virtualized ? undefined : 'nowrap' }}
                      aria-sort={
                        dir === 'asc'
                          ? 'ascending'
                          : dir === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                    >
                      {canSort ? (
                        // Native `title` rather than <Tooltip>: this renders once
                        // per sortable header on every keystroke elsewhere in the
                        // page, and MUI's Tooltip is far too costly at that rate.
                        <TableSortLabel
                          active={!!dir}
                          direction={dir === false ? 'asc' : dir}
                          title={t(
                            isGrouped ? 'common.sortHintGrouped' : 'common.sortHint',
                          )}
                          onClick={
                            isGrouped
                              ? () => toggleGroupSort(header.column.id)
                              : header.column.getToggleSortingHandler()
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {effectiveSorting.length > 1 && sortIndex >= 0 && (
                            <Typography
                              component="sup"
                              variant="caption"
                              sx={{
                                ml: 0.25,
                                color: isGrouped
                                  ? 'text.disabled'
                                  : 'text.secondary',
                              }}
                            >
                              {sortIndex + 1}
                            </Typography>
                          )}
                        </TableSortLabel>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
            {enableColumnFilters && showFilters && (
              <TableRow>
                {table.getAllLeafColumns().map((col) =>
                  col.getIsVisible() ? (
                    <TableCell key={col.id}>
                      {col.getCanFilter() ? (
                        <TextField
                          value={(col.getFilterValue() as string) ?? ''}
                          onChange={(e) => col.setFilterValue(e.target.value)}
                          size="small"
                          placeholder={t('common.filter')}
                          variant="standard"
                          fullWidth
                        />
                      ) : null}
                    </TableCell>
                  ) : null,
                )}
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {isLoading &&
              SKELETON_ROW_KEYS.map((rowKey) => (
                <TableRow key={rowKey}>
                  {table.getAllLeafColumns().map((col) =>
                    col.getIsVisible() ? (
                      <TableCell key={col.id}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ) : null,
                  )}
                </TableRow>
              ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  align="center"
                  sx={{ py: 4, color: 'text.secondary' }}
                >
                  {emptyMessage ?? t('common.noRecords')}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              (canVirtualize ? (
                <VirtualRows
                  rows={rows}
                  scrollEl={scrollEl}
                  colSpan={table.getVisibleLeafColumns().length}
                  renderRow={renderRow}
                />
              ) : (
                // The explicit arrow matters: `rows.map(renderRow)` would pass
                // map's third argument into the measureRef slot.
                rows.map((row, i) => renderRow(row, i))
              ))}
          </TableBody>
          {hasAnyFooter && (
            <TableFooter>
              {table.getFooterGroups().map((fg) => (
                <TableRow key={fg.id}>
                  {fg.headers.map((header) => {
                    const align = header.column.columnDef.meta?.align ?? 'left'
                    return (
                      <TableCell
                        key={header.id}
                        align={align}
                        sx={{
                          fontWeight: 600,
                          position: 'sticky',
                          bottom: 0,
                          bgcolor: 'background.paper',
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </Paper>
  )
}

interface VirtualRowsProps<TData> {
  rows: Row<TData>[]
  scrollEl: HTMLDivElement | null
  colSpan: number
  renderRow: (
    row: Row<TData>,
    index: number,
    measureRef?: Ref<HTMLTableRowElement>,
  ) => ReactNode
}

/**
 * Renders the rows near the viewport, padded above and below by spacer rows so
 * the scrollbar still spans the whole set. A child component, so the hook is
 * never called conditionally.
 */
function VirtualRows<TData>({
  rows,
  scrollEl,
  colSpan,
  renderRow,
}: Readonly<VirtualRowsProps<TData>>) {
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollEl,
    // Leaf rows carry an IconButton on some lists (~43px); group headers are
    // plain text (~33px). A flat estimate under-fills the first window.
    estimateSize: (i) => (rows[i].getIsGrouped() ? 33 : 43),
    // row.id is stable across the index shifts an expand/collapse causes.
    getItemKey: (i) => rows[i].id,
    overscan: 8,
  })

  const items = virtualizer.getVirtualItems()
  const padTop = items.length ? items[0].start : 0
  // Clamped: re-measurement can transiently drive this negative.
  const padBottom = items.length
    ? Math.max(0, virtualizer.getTotalSize() - items[items.length - 1].end)
    : 0

  // Spacers need a cell — a <tr> with no cells generates no cell boxes and
  // collapses to zero height. The padding/border reset strips the ~13px MUI
  // would otherwise add per spacer.
  const spacer = (height: number, key: string) =>
    height > 0 ? (
      <tr aria-hidden key={key}>
        <td colSpan={colSpan} style={{ height, padding: 0, border: 0 }} />
      </tr>
    ) : null

  return (
    <>
      {spacer(padTop, 'virtual-pad-top')}
      {items.map((item) =>
        renderRow(rows[item.index], item.index, virtualizer.measureElement),
      )}
      {spacer(padBottom, 'virtual-pad-bottom')}
    </>
  )
}
