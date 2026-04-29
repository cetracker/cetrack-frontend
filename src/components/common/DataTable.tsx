import { useMemo, useState, type ReactNode } from 'react'
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
  type RowData,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'

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
  title?: ReactNode
  toolbarExtras?: ReactNode
}

export function DataTable<TData>(props: Readonly<DataTableProps<TData>>) {
  const {
    columns,
    data,
    isLoading,
    error,
    onRetry,
    onRowClick,
    emptyMessage = 'No records',
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
    title,
    toolbarExtras,
  } = props

  const [showFilters, setShowFilters] = useState(false)
  const [colMenuEl, setColMenuEl] = useState<HTMLElement | null>(null)
  const [groupMenuEl, setGroupMenuEl] = useState<HTMLElement | null>(null)

  const [internalGlobalFilter, setInternalGlobalFilter] = useState('')
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([])
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
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

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter: globalFilter ?? internalGlobalFilter,
      columnFilters: columnFilters ?? internalColumnFilters,
      sorting: sorting ?? internalSorting,
      grouping: grouping ?? internalGrouping,
      columnVisibility: effectiveColumnVisibility,
    },
    onGlobalFilterChange: onGlobalFilterChange ?? setInternalGlobalFilter,
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    onSortingChange: onSortingChange ?? setInternalSorting,
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

  return (
    <Paper elevation={1} sx={{ display: 'flex', flexDirection: 'column' }}>
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
            placeholder="Search…"
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
          <Tooltip title={showFilters ? 'Hide filters' : 'Show filters'}>
            <IconButton onClick={() => setShowFilters((v) => !v)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
        {enableGrouping && onGroupingChange && (
          <>
            <Tooltip title="Grouping">
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
                <MenuItem disabled>No groupable columns</MenuItem>
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
        <Tooltip title="Columns">
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
                Retry
              </Button>
            ) : undefined
          }
        >
          {error.message}
        </Alert>
      )}

      <TableContainer sx={{ maxHeight }}>
        <Table size="small" stickyHeader={stickyHeader}>
          <TableHead>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const dir = header.column.getIsSorted()
                  const align =
                    header.column.columnDef.meta?.align ?? 'left'
                  return (
                    <TableCell
                      key={header.id}
                      align={align}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {canSort ? (
                        <TableSortLabel
                          active={!!dir}
                          direction={dir === false ? 'asc' : dir}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                          placeholder="Filter"
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
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              rows.map((row) => {
                const isGroup = row.getIsGrouped()
                return (
                  <TableRow
                    key={row.id}
                    hover={!!onRowClick && !isGroup}
                    onClick={
                      onRowClick && !isGroup
                        ? () => onRowClick(row.original)
                        : undefined
                    }
                    sx={{
                      cursor: onRowClick && !isGroup ? 'pointer' : 'default',
                      '&:nth-of-type(odd)': (theme) => ({
                        bgcolor: theme.palette.action.hover,
                      }),
                      ...(isGroup && {
                        bgcolor: (theme) => theme.palette.action.selected,
                      }),
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align =
                        cell.column.columnDef.meta?.align ?? 'left'
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}{' '}
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
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
