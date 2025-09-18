import axios from 'axios'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSettings } from '@/context/settings-context'

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

// 分析開始のパラメータ
export interface StartAnalysisParams {
  space_id: string
  query: string
  tables?: string[]
  mode?: string
  model?: string
  index?: number
}

// 分析開始のレスポンス
export interface StartAnalysisResponse {
  id?: string
  error?: string
}

// スペース作成のレスポンス
export interface CreateSpaceResponse {
  id: string
}

// スペース取得のレスポンス
export interface GetSpaceResponse {
  analysis_ids: string[]
}

// レポート取得のレスポンス
export interface ReportResponse {
  done: boolean
  progress: string
  query: string
  error: string
  python_code: string
  content: ReportContent[]
  steps: ActionStep[]
  followups?: FollowupContent[]
}

export interface FollowupContent {
  progress: string
  query: string
  error: string
  python_code: string
  content: ReportContent[]
  steps: ActionStep[]
}

export interface ActionStep {
  type: string
  query?: string
  python?: string
  content?: string
}

// モデル情報の型定義
export interface ModelInfo {
  id: string
  name: string
  description: string
}

// モデルリスト取得のレスポンス
export interface ModelListResponse {
  models: ModelInfo[]
}

// レポートコンテンツの型定義
export type ReportContent =
  | { type: 'markdown'; content: string }
  | { type: 'variable'; data: string }
  | { type: 'image'; base64: string }
  | { type: 'table'; table: string }

// モデルリスト取得API (base_url, api_key をクエリパラメータで渡す)
const getModelList = async (params: { base_url?: string; api_key?: string }): Promise<ModelListResponse> => {
  const response = await axios.get<ModelListResponse>(`${API_BASE_URL}/get-model-list`, {
    params: {
      base_url: params.base_url || undefined,
      api_key: params.api_key || undefined,
    },
  })
  return response.data
}

//スペースの作成と取得API
const createSpace = async (): Promise<CreateSpaceResponse> => {
  const response = await axios.post<CreateSpaceResponse>(`${API_BASE_URL}/create-space`)
  return response.data
}

const getSpace = async (id: string): Promise<GetSpaceResponse> => {
  const response = await axios.get<GetSpaceResponse>(`${API_BASE_URL}/get-space/${id}`)
  return response.data
}

// 分析開始API
const startAnalysis = async (params: StartAnalysisParams): Promise<StartAnalysisResponse> => {
  const response = await axios.post<StartAnalysisResponse>(`${API_BASE_URL}/start-analysis`, {
    space_id: params.space_id,
      query: params.query,
      tables: params.tables || [],
      mode: params.mode || 'standard',
      model: params.model || '',
      index: params.index,
  })
  return response.data
}

// レポート取得API
const getReport = async (id: string): Promise<ReportResponse> => {
  const response = await axios.get<ReportResponse>(`${API_BASE_URL}/get-report`, {
    params: { id }
  })
  return response.data
}

// モデルリスト取得フック
export const useModelList = () => {
  const { baseUrl, apiKey } = useSettings()
  return useQuery({
    queryKey: ['modelList', baseUrl, !!apiKey],
    queryFn: () => getModelList({ base_url: baseUrl, api_key: apiKey || "" }),
    enabled: !!baseUrl, // baseUrl が設定されている場合のみ
    staleTime: 50,
  })
}

// モード別モデルリスト取得フック（統合版）
export const useModelListByMode = (isAgentic: boolean) => {
  const { baseUrl, apiKey } = useSettings()
  return useQuery({
    queryKey: ['modelList', isAgentic ? 'agentic' : 'standard', baseUrl, !!apiKey],
    queryFn: () => getModelList({ base_url: baseUrl, api_key: apiKey }),
    enabled: !!baseUrl,
    staleTime: 5 * 60 * 1000,
  })
}

// 分析開始フック
export const useStartAnalysis = () => {
  return useMutation({
    mutationFn: startAnalysis,
  })
}

// スペース作成フック
export const useCreateSpace = () => {
  return useMutation({
    mutationFn: createSpace,
  })
}

// スペース取得フック
export const useGetSpace = (id: string) => {
  return useQuery({
    queryKey: ['space', id],
    queryFn: () => getSpace(id),
    enabled: !!id, // idが存在する場合のみ実行
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    // refetchInterval: 2000, // 2秒ごとに新しい分析が追加されているかチェック
    // refetchIntervalInBackground: true,
  })
}

// レポート取得フック（ポーリング対応）
export const useReport = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => getReport(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      // doneがfalseの場合は1000ミリ秒後に再取得
      return query.state.data?.done === false ? 1000 : false
    },
    refetchIntervalInBackground: true,
  })
}