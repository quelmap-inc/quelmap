import { useState, useMemo } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { IconDatabase, IconRefresh, IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'
import {
  useInfiniteTableData,
  TableDataParams,
  useDeleteTable,
} from '@/hooks/use-table-data'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Setting } from '@/components/setting'
import { EditableTableName } from './components/editable-table-name'
import { InfiniteTableDataTable } from './components/infinite-table-data-table'
import { createTableColumns } from './components/table-columns'

export default function TablePreview() {
  const { tableName } = useParams({ from: '/_authenticated/table/$tableName' })
  const navigate = useNavigate()

  // Manage sort and filter state
  const [tableParams, setTableParams] = useState<
    Omit<TableDataParams, 'offset'>
  >({
    limit: 100,
  })

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTableData(tableName, tableParams)

  const deleteTableMutation = useDeleteTable()

  // Table deletion handler
  const handleDeleteTable = () => {
    deleteTableMutation.mutate(tableName, {
      onSuccess: () => {
  toast.success(`Deleted table "${tableName}"`)
        navigate({ to: '/' })
      },
      onError: (error: any) => {
        console.error('Table delete error:', error)
  let errorMessage = `Failed to delete table "${tableName}"`

  // Extract message from Axios error response
        if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail
        } else if (error?.message) {
          errorMessage = error.message
        }

        toast.error(errorMessage)
      },
    })
  }

  // Combine data from all pages
  const allData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || []
  }, [data])

  // First page info (columns etc.)
  const firstPage = data?.pages[0]
  const totalRows = firstPage?.total_rows || 0
  const currentRows = allData.length

  // Sort
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setTableParams((prev) => ({
      ...prev,
      sort_column: column,
      sort_direction: direction,
    }))
  }

  // Filter
  const handleFilter = (column: string, value: string) => {
    setTableParams((prev) => ({
      ...prev,
      filter_column: column,
      filter_value: value,
    }))
  }

  // Clear filter
  const handleClearFilter = () => {
    setTableParams((prev) => ({
      ...prev,
      filter_column: undefined,
      filter_value: undefined,
    }))
  }

  const columns = firstPage
    ? createTableColumns(firstPage.columns, {
        onSort: handleSort,
        currentSortColumn: tableParams.sort_column,
        currentSortDirection: tableParams.sort_direction,
      })
    : []

  if (isLoading) {
    return (
      <>
        <Header fixed>
          <div className='flex items-center gap-4'>
            <h1 className='text-lg font-semibold'>{tableName}</h1>
          </div>
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <Setting />
          </div>
        </Header>
        <Main>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center'>
              <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
              <p className='text-muted-foreground'>
                Loading table data...
              </p>
            </div>
          </div>
        </Main>
      </>
    )
  }

  if (error || !firstPage) {
    return (
      <>
        <Header fixed>
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <Setting />
          </div>
        </Header>
        <Main>
          <div className='flex h-[400px] items-center justify-center'>
            <div className='text-center'>
              <div className='mb-4 text-red-500'>
                <IconDatabase size={48} className='mx-auto mb-2' />
              </div>
              <h3 className='mb-2 text-lg font-semibold'>
                Failed to load table data
              </h3>
              <p className='text-muted-foreground mb-4'>
                Could not retrieve data for table "{tableName}".
                <br />
                Please ensure the server is running.
              </p>
              <Button onClick={() => refetch()} variant='outline'>
                <IconRefresh size={16} className='mr-2' />
                Retry
              </Button>
            </div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <Setting />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-col space-y-2 gap-x-4'>
          <div>
            <div className='mb-2 flex items-center space-x-2'>
              <EditableTableName
                tableName={tableName}
                onSuccess={(newTableName) =>
                  navigate({
                    to: '/table/$tableName',
                    params: { tableName: newTableName },
                  })
                }
                className='text-2xl font-bold tracking-tight'
              />
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button onClick={() => refetch()} variant='link'>
              <IconRefresh size={16} className='mr-2' />
              Refresh
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='link'
                  disabled={deleteTableMutation.isPending}
                >
                  <IconTrash size={16} className='mr-2' />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this table?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete table "{tableName}". This action cannot be undone. All data in this table will be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTable}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1'>
          <InfiniteTableDataTable
            data={allData}
            columns={columns}
            tableColumns={firstPage.columns}
            onFilter={handleFilter}
            currentFilterColumn={tableParams.filter_column}
            currentFilterValue={tableParams.filter_value}
            onClearFilter={handleClearFilter}
            onLoadMore={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            totalRows={totalRows}
            currentRows={currentRows}
          />
        </div>
      </Main>
    </>
  )
}
