import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateTableColumnsOptions {
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  currentSortColumn?: string
  currentSortDirection?: 'asc' | 'desc'
}

export const createTableColumns = (
  columns: string[],
  options: CreateTableColumnsOptions = {}
): ColumnDef<Record<string, any>>[] => {
  const { onSort, currentSortColumn, currentSortDirection } = options

  return columns.map((column) => ({
    accessorKey: column,
    header: ({ column: tableColumn }) => {
      const isSorted = currentSortColumn === column
      const direction = isSorted ? currentSortDirection : undefined

      return (
        <Button
          variant='ghost'
          onClick={() => {
            if (onSort) {
              const newDirection =
                isSorted && direction === 'asc' ? 'desc' : 'asc'
              onSort(column, newDirection)
            } else {
              // Fallback: client-side sorting
              tableColumn.toggleSorting(direction === 'asc')
            }
          }}
          className='h-8 px-2 lg:px-3'
        >
          {column}
          {onSort ? (
            // Server-side sort icons
            isSorted ? (
              direction === 'asc' ? (
                <ArrowUp className='ml-2 h-4 w-4' />
              ) : (
                <ArrowDown className='ml-2 h-4 w-4' />
              )
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )
          ) : (
            // Client-side sort icons
            <ArrowUpDown className='ml-2 h-4 w-4' />
          )}
        </Button>
      )
    },
    cell: ({ getValue }) => {
      const value = getValue()
      if (value === null || value === undefined) {
        return <span className='text-muted-foreground italic'>NULL</span>
      }
      if (typeof value === 'object') {
        return (
          <span className='text-muted-foreground'>{JSON.stringify(value)}</span>
        )
      }
      return <span>{String(value)}</span>
    },
  }))
}
