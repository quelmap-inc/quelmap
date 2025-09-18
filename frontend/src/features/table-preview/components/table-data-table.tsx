import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  tableColumns?: string[]
  onFilter?: (column: string, value: string) => void
  currentFilterColumn?: string
  currentFilterValue?: string
  onClearFilter?: () => void
}

export function TableDataTable<TData, TValue>({
  columns,
  data,
  tableColumns = [],
  onFilter,
  currentFilterColumn,
  currentFilterValue,
  onClearFilter,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  // State for server-side filtering
  const [filterColumn, setFilterColumn] = React.useState(
    currentFilterColumn || ''
  )
  const [filterValue, setFilterValue] = React.useState(currentFilterValue || '')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleServerFilter = () => {
    if (onFilter && filterColumn && filterValue) {
      onFilter(filterColumn, filterValue)
    }
  }

  const handleClearFilter = () => {
    setFilterColumn('')
    setFilterValue('')
    if (onClearFilter) {
      onClearFilter()
    }
  }

  return (
    <div className='space-y-4'>
      {/* Filter controls */}
      <div className='flex items-center space-x-2'>
        <div className='flex flex-1 items-center space-x-2'>
          <Select value={filterColumn} onValueChange={setFilterColumn}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Select column to filter' />
            </SelectTrigger>
            <SelectContent>
              {tableColumns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder='Enter filter value...'
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className='max-w-xs'
            disabled={!filterColumn}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleServerFilter()
              }
            }}
          />

          <Button
            onClick={handleServerFilter}
            disabled={!filterColumn || !filterValue}
            variant='outline'
          >
            Filter
          </Button>

          {(currentFilterColumn || currentFilterValue) && (
            <Button onClick={handleClearFilter} variant='outline' size='sm'>
              <X className='mr-1 h-4 w-4' />
              Clear
            </Button>
          )}
        </div>

        {/* Global search (client-side) */}
        <Input
          placeholder='Search table...'
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className='max-w-sm'
        />
      </div>

      {/* Current filter display */}
      {currentFilterColumn && currentFilterValue && (
        <div className='text-muted-foreground flex items-center space-x-2 text-sm'>
          <span>Filtering:</span>
          <span className='font-medium'>{currentFilterColumn}</span>
          <span>=</span>
          <span className='font-medium'>"{currentFilterValue}"</span>
        </div>
      )}

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between px-2'>
        <div className='text-muted-foreground flex-1 text-sm'>
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} rows
        </div>
        <div className='flex items-center space-x-6 lg:space-x-8'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium'>Page size</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className='border-input bg-background h-8 w-[70px] rounded border px-3 py-1 text-sm'
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} /{' '}
            {table.getPageCount()}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='hidden h-8 w-8 p-0 lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
