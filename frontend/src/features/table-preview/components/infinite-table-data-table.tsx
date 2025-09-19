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
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InfiniteDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  tableColumns?: string[]
  onFilter?: (column: string, value: string) => void
  currentFilterColumn?: string
  currentFilterValue?: string
  onClearFilter?: () => void
  onLoadMore?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  totalRows?: number
  currentRows?: number
}

export function InfiniteTableDataTable<TData, TValue>({
  columns,
  data,
  currentFilterColumn,
  currentFilterValue,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  totalRows,
  currentRows,
}: InfiniteDataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

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
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className='space-y-4'>
      {/* Filter controls */}
      <div className='flex items-center space-x-2'>

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

      {/* Data statistics */}
      <div className='text-muted-foreground flex items-center justify-between text-sm'>
        <span>
          Showing {currentRows?.toLocaleString() || 0} / {totalRows?.toLocaleString() || 0} rows
        </span>
        {/* {hasNextPage && (
          <span>More rows can be loaded</span>
        )} */}
      </div>

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

      {/* Load more button */}
      {hasNextPage && (
        <div className='flex justify-center pt-4'>
          <Button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            variant='outline'
            className='flex items-center space-x-2'
          >
            {isFetchingNextPage ? (
              <>
                <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2'></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <ChevronDown className='h-4 w-4' />
                <span>Load more (100 rows)</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
