import axios from 'axios'
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'

export interface TableDataResponse {
  table_name: string
  columns: string[]
  data: Record<string, any>[]
  total_rows: number
  preview_rows: number
}

export interface TableDataParams {
  limit?: number
  offset?: number
  sort_column?: string
  sort_direction?: 'asc' | 'desc'
  filter_column?: string
  filter_value?: string
}

const fetchTableData = async (
  tableName: string,
  params: TableDataParams = {}
): Promise<TableDataResponse> => {
  const response = await axios.get<TableDataResponse>(
    `${API_BASE_URL}/api/table-data/${tableName}`,
    {
      params,
    }
  )
  return response.data
}

// テーブル削除API
const deleteTable = async (tableName: string): Promise<void> => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/delete-table/${tableName}`
  )
  console.log('削除API レスポンス:', response.data)
  return response.data
}

// テーブル名変更API
const renameTable = async (
  tableName: string,
  newTableName: string
): Promise<void> => {
  const formData = new FormData()
  formData.append('new_table_name', newTableName)
  const response = await axios.put(
    `${API_BASE_URL}/api/rename-table/${tableName}`,
    formData
  )
  return response.data
}

export const useTableData = (
  tableName: string,
  params: TableDataParams = {}
) => {
  return useQuery({
    queryKey: ['tableData', tableName, params],
    queryFn: () => fetchTableData(tableName, params),
    staleTime: 2 * 60 * 1000, // 2分間キャッシュ
    refetchOnWindowFocus: false,
    enabled: !!tableName, // tableNameが存在する場合のみクエリを実行
  })
}

// 無限スクロール用のフック
export const useInfiniteTableData = (
  tableName: string,
  baseParams: Omit<TableDataParams, 'offset'> = {}
) => {
  return useInfiniteQuery({
    queryKey: ['infiniteTableData', tableName, baseParams],
    queryFn: ({ pageParam = 0 }) =>
      fetchTableData(tableName, { ...baseParams, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      // 次のページがあるかチェック
      const totalFetched = allPages.reduce(
        (sum, page) => sum + page.preview_rows,
        0
      )
      return totalFetched < lastPage.total_rows ? totalFetched : undefined
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!tableName,
    initialPageParam: 0,
  })
}

// テーブル削除用のフック
export const useDeleteTable = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTable,
    onSuccess: (_, tableName: string) => {
      // テーブルリストのキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['tableList'] })
      // 削除されたテーブルのデータキャッシュも削除
      queryClient.removeQueries({ queryKey: ['tableData', tableName] })
      queryClient.removeQueries({ queryKey: ['infiniteTableData', tableName] })
    },
  })
}

// テーブル名変更用のフック
export const useRenameTable = (onError: (error: any) => void) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tableName,
      newTableName,
    }: {
      tableName: string
      newTableName: string
    }) => renameTable(tableName, newTableName),
    onSuccess: (_, { tableName }) => {
      // テーブルリストのキャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['tableList'] })
      // 古いテーブル名のキャッシュを削除
      queryClient.removeQueries({ queryKey: ['tableData', tableName] })
      queryClient.removeQueries({ queryKey: ['infiniteTableData', tableName] })
    },
    onError: onError,
  })
}
