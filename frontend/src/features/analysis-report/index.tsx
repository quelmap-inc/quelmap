import { useParams } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import Split from 'react-split'
import { Main } from '@/components/layout/main'
import { Header } from '@/components/layout/header'
import { ThemeSwitch } from '@/components/theme-switch'
import { Setting } from '@/components/setting'
import { LoaderCircle, AlertCircle,Pencil, Copy, Check } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useReport, useGetSpace, type ActionStep } from '@/hooks/use-analysis'
import { ReportContent } from './components/report-content'
import { SidePanel } from './components/side-panel'
import { motion, AnimatePresence } from 'framer-motion'
import FollowupInput from './components/followup-input'
import { useSharedAnalysisHistory } from '@/context/analysis-history-context'
import { useStartAnalysis, useModelListByMode, type ModelInfo } from '@/hooks/use-analysis'
import { useTableList } from '@/hooks/use-table-list'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
// 型定義
interface SidePanelContentType {
  type: 'code' | 'table' | 'step'
  content: string
  stepData?: ActionStep
}


// 個別の分析レポート表示コンポーネント
function AnalysisReportItem({ 
  analysisId, 
  onShowSidePanel,
  itemRef,
  setIsProcessing,
  analysisIndex,
  onEditSubmit,
  isGlobalSubmitting
}: { 
  analysisId: string
  onShowSidePanel: (content: SidePanelContentType) => void 
  itemRef?: React.RefObject<HTMLDivElement | null>
  setIsProcessing?: React.Dispatch<React.SetStateAction<boolean>>
  analysisIndex: number
  onEditSubmit: (params: { query: string; index: number }) => Promise<void>
  isGlobalSubmitting: boolean
}) {
  const { data: report, isLoading, error } = useReport(analysisId)

  setIsProcessing?.(isLoading || !report?.done)

  // 追加: コピー状態管理
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  // 編集開始
  const startEditing = () => {
    if (!report) return
    setEditValue(report.query || '')
    setIsEditing(true)
    setTimeout(() => editTextareaRef.current?.focus(), 0)
  }

  // 編集キャンセル
  const cancelEditing = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleEditKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!editValue.trim()) {
        cancelEditing()
        return
      }
      await onEditSubmit({ query: editValue.trim(), index: analysisIndex })
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    }
  }

  const onRedoClick = () => {
    if (report) {
      onEditSubmit({ query: report.query, index: analysisIndex })
    }
  }

  const handleCopy = async (query: string) => {
    if (!query) return
    try {
      await navigator.clipboard.writeText(query)
      setCopyState('success')
    } catch {
      setCopyState('error')
    } finally {
      // 一定時間後にリセット
      setTimeout(() => setCopyState('idle'), 1800)
    }
  }

  const copyMessage =
    copyState === 'idle'
      ? 'copy to clipboard'
      : copyState === 'success'
      ? 'copied'
      : 'copy failed'

  if (error) {
    return (
      <div className='max-w-3xl mx-auto p-4'>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            分析ID {analysisId} のレポート取得に失敗しました。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || !report) {
    return (
      <div className='max-w-3xl mx-auto p-4'>
        <h2 className='text-3xl font-bold'>Analysis Starting...</h2>
        <div className='my-5 flex gap-2'>
          <LoaderCircle className='animate-spin' size={20} />
          <p>Loading model...</p>
        </div>
      </div>
    )
  }

  if (report.error) {
    return (
      <div className='max-w-3xl mx-auto p-4'>
        <h2 className='text-3xl font-bold'>{report.query || 'Data Analysis'}</h2>
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {report.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div ref={itemRef} className='max-w-3xl mx-auto p-4'>
      <div className="group flex flex-row gap-3 relative mb-6 w-auto">
        {isEditing ? (
          <div className="flex-1">
            <textarea
              ref={editTextareaRef}
              defaultValue={editValue}
              onBlur={cancelEditing}
              onKeyDown={handleEditKeyDown}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full resize-none rounded-md border border-border bg-background p-2 text-2xl font-bold leading-snug focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
              aria-label="Edit"
            />
            <p className="mt-1 text-xs text-muted-foreground">Enter to confirm / Esc or focus out to cancel / Shift+Enter for new line</p>
          </div>
        ) : (
          <>
            <motion.h2 
              className="text-3xl font-bold pr-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {report.query}
            </motion.h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='link'
                    onClick={() => handleCopy(report.query)}
                    aria-label="コピー"
                    className="rounded-md mt-3
                      opacity-0 group-hover:opacity-100 transition-opacity
                      hover:bg-accent hover:text-accent-foreground
                      text-muted-foreground p-1"
                    title={copyMessage}
                    disabled={isGlobalSubmitting}
                  >
                    {copyState === 'success' ? (<Check className="w-4 h-4" />) : (<Copy className="w-4 h-4" />)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{copyMessage}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
                    variant='link'
              onClick={startEditing}
              aria-label="Edit"
              className="rounded-md mt-3
                 opacity-0 group-hover:opacity-100 transition-opacity
                 hover:bg-accent hover:text-accent-foreground
                 text-muted-foreground p-1 disabled:opacity-0"
              disabled={isGlobalSubmitting}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      
      <AnimatePresence mode="wait">
        {report.progress !== "" && (
          <motion.div 
            key={report.progress}
            className='my-5 flex gap-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoaderCircle className='animate-spin' size={20} />
            <p>{report.progress || 'Analyzing...'}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={`${report.content}-${report.python_code}-${JSON.stringify(report.steps)}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <ReportContent 
          content={report.content}
          pythonCode={report.python_code}
          steps={report.steps}
          onShowSidePanel={onShowSidePanel}
          handleRedoClick={onRedoClick}
        />
      </motion.div>
    </div>
  )
}

export default function AnalysisReport() {
  const { reportId } = useParams({ from: '/_authenticated/report/$reportId' })
  const spaceId = reportId // URLパラメータをspaceIdとして扱う
  const { data: space, isLoading: spaceLoading, error: spaceError, refetch: refetchSpace } = useGetSpace(spaceId)
  const [sidePanelContent, setSidePanelContent] = useState<SidePanelContentType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const latestItemRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  // フォローアップ入力の状態を上位で管理
  const [followupText, setFollowupText] = useState<string>('')
  const [followupModel, setFollowupModel] = useState<string>('')
  const [followupAgenticMode, setFollowupAgenticMode] = useState<boolean>(false)
  const [followupSelectedTables, setFollowupSelectedTables] = useState<string[]>([])
  const { setItemLoading } = useSharedAnalysisHistory()
  const startFollowupMutation = useStartAnalysis()
  const { data: tables, error: tablesError } = useTableList()
  const { data: modelData } = useModelListByMode(followupAgenticMode)
  const [followupStatus, setFollowupStatus] = useState<'submitted' | 'streaming' | 'ready' | 'error'>('ready')

  useEffect(()=>{
      setItemLoading(reportId, isProcessing)
  },[isProcessing, reportId, setItemLoading])

  // モデルリスト初期化
  useEffect(() => {
    if (modelData?.models && modelData.models.length > 0) {
      const exists = modelData.models.find((m: ModelInfo) => m.id === followupModel)
      if (!exists) {
        setFollowupModel(modelData.models[0].id)
      }
    }
  }, [modelData, followupModel])

  // テーブル全選択初期化
  useEffect(() => {
    if (tables && tables.length > 0 && followupSelectedTables.length === 0) {
      setFollowupSelectedTables(tables.map(t => t.name))
    }
  }, [tables])

  // processing状態に応じて入力Status更新
  useEffect(() => {
    if (isProcessing) setFollowupStatus('submitted')
    else setFollowupStatus('ready')
  }, [isProcessing])

  // フォローアップ分析が追加された時の更新処理
  const handleFollowupSubmitted = () => {
    // スペースデータを再取得して新しい分析IDを取得
    refetchSpace()
    setRefreshKey(prev => prev + 1)
    
    // 少し遅延してから最新のクエリまでスクロール
    setTimeout(() => {
      scrollToLatest()
    }, 500)
  }

  // Followup送信処理（以前は子コンポーネント内部）
  const handleFollowupSubmit = async ({ text }: { text: string }) => {
    if (!text.trim()) return
    if (!tables || tables.length === 0 || tablesError) {
      toast.error('At least one table must be connected to start the follow-up analysis.')
      return
    }
    if (followupSelectedTables.length === 0) {
      toast.error('Please select at least one table.')
      return
    }
    setFollowupStatus('submitted')
    try {
      const result = await startFollowupMutation.mutateAsync({
        space_id: spaceId,
        query: text.trim(),
        tables: followupSelectedTables,
        mode: followupAgenticMode ? 'agentic' : 'standard',
        model: followupModel,
        index: -1,
      })
      if (result.error) {
        toast.error(result.error)
        setFollowupStatus('error')
      } else {
        setFollowupText('')
        setFollowupStatus('ready')
        handleFollowupSubmitted()
      }
  } catch (_err) {
      toast.error('Failed to start analysis')
      setFollowupStatus('error')
      setTimeout(() => setFollowupStatus('ready'), 3000)
    }
  }

  // 既存クエリ編集送信（index 指定）
  const handleEditSubmit = async ({ query, index }: { query: string; index: number }) => {
    if (!query.trim()) return
    if (!tables || tables.length === 0 || tablesError) {
      toast.error('You need one or more tables.')
      return
    }
    setFollowupStatus('submitted')
    try {
      await startFollowupMutation.mutateAsync({
        space_id: spaceId,
        query: query.trim(),
        tables: followupSelectedTables.length ? followupSelectedTables : (tables?.map(t=>t.name) ?? []),
        mode: followupAgenticMode ? 'agentic' : 'standard',
        model: followupModel,
        index: index,
      })
      handleFollowupSubmitted()
      setFollowupStatus('ready')
    } catch (_err) {
      toast.error('Failed to start analysis')
      setFollowupStatus('error')
      setTimeout(() => setFollowupStatus('ready'), 3000)
    }
  }

  // 最新のクエリまでスムーズスクロール
  const scrollToLatest = () => {
    if (latestItemRef.current && scrollContainerRef.current) {
      // 最新のアイテムの上部が画面上部に来るように計算
      const itemTop = latestItemRef.current.offsetTop
      scrollContainerRef.current.scrollTo({
        top: itemTop,
        behavior: 'smooth'
      })
    }
  }

  // スクロール位置を保存
  const saveScrollPosition = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollTop);
    }
  };

  // スクロール位置を復元
  const restoreScrollPosition = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'auto',
      });
    }
  };

  // 初回ページ読み込み時に最新クエリまでスクロール
  useEffect(() => {
    if (space && space.analysis_ids && space.analysis_ids.length > 1) {
      // 複数の分析がある場合、少し遅延してスクロール
      setTimeout(() => {
        scrollToLatest()
      }, 1000)
    }
  }, [space?.analysis_ids?.length])

  useEffect(() => {
    restoreScrollPosition();
  }, [sidePanelContent]);

  // 共通のヘッダー
  const headerElement = (
    <Header>
      <div className='ml-auto flex items-center space-x-4'>
  <ThemeSwitch />
  <Setting />
      </div>
    </Header>
  )

  // メインコンテンツの決定
  let mainContent: React.ReactNode

  if (spaceError) {
    mainContent = (
      <div className='max-w-3xl mx-auto p-4'>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Missing or invalid analysis report.
          </AlertDescription>
        </Alert>
      </div>
    )
  } else if (spaceLoading || !space) {
    mainContent = (
      <div className='max-w-3xl mx-auto p-4'>
        <h1 className='text-4xl font-bold'>Loading space...</h1>
        <div className='my-5 flex gap-2'>
          <LoaderCircle className='animate-spin' size={20} />
          <p>Loading data...</p>
        </div>
      </div>
    )
  } else {
    // スペース内の分析結果を表示
    const analysisIds = space.analysis_ids || []
    
    if (analysisIds.length === 0) {
      mainContent = (
        <div className='max-w-3xl mx-auto p-4'>
          <h1 className='text-4xl font-bold'>Lost Analysis</h1>
          <p className='text-muted-foreground'>There are no analysis results in this space yet. This will happen once you restarted app.</p>
        </div>
      )
    } else {
      // 複数の分析結果を含むレイアウト
      const analysisReports = (
        <div className="relative h-full">
          <div 
            ref={scrollContainerRef}
            className="h-full overflow-auto pb-24" 
            onScroll={saveScrollPosition} // スクロールイベントで位置を保存
          >
            {/* フォローアップ入力分の余白を確保 */}
            <div className="space-y-8 mb-[100px]">
              {analysisIds.map((analysisId, index) => {
                const isLast = index === analysisIds.length - 1
                return (
                  <div key={`${analysisId}-${refreshKey}`} className="">
                    <AnalysisReportItem
                      analysisId={analysisId}
                      onShowSidePanel={setSidePanelContent}
                      itemRef={isLast ? latestItemRef : undefined}
                      setIsProcessing={isLast ? setIsProcessing : undefined}
                      analysisIndex={index}
                      onEditSubmit={handleEditSubmit}
                      isGlobalSubmitting={followupStatus === 'submitted'}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          {/* フォローアップ入力エリア - 親コンテナに対してsticky */}
          <FollowupInput 
            text={followupText}
            onTextChange={setFollowupText}
            model={followupModel}
            onModelChange={setFollowupModel}
            models={modelData?.models || []}
            agenticMode={followupAgenticMode}
            onAgenticModeChange={setFollowupAgenticMode}
            selectedTables={followupSelectedTables}
            onSelectedTablesChange={setFollowupSelectedTables}
            tables={tables}
            tablesError={tablesError}
            status={followupStatus}
            isprocessing={isProcessing}
            onSubmit={handleFollowupSubmit}
          />
        </div>
      )

      mainContent = sidePanelContent ? (
        <Split
          sizes={[65, 35]}
          minSize={[500, 400]}
          className="flex h-full"
        >
          <div className="h-full overflow-hidden"> {/* overflow-autoを削除してanalysisReports内で管理 */}
            {analysisReports}
          </div>
          <div className="h-full border-l overflow-auto">
            <AnimatePresence>
              {sidePanelContent && (
                <motion.div
                  key={sidePanelContent.type + sidePanelContent.content}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <SidePanel
                    type={sidePanelContent.type}
                    content={sidePanelContent.content}
                    stepData={sidePanelContent.stepData}
                    onClose={() => setSidePanelContent(null)}
                    inSplitView={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Split>
      ) : (
        <div className="h-full overflow-hidden"> {/* overflow-autoを削除してanalysisReports内で管理 */}
          {analysisReports}
        </div>
      )
    }
  }

  return (
    <>
      {headerElement}
      <Main className={`relative ${space && space.analysis_ids.length > 0 ? "p-0 h-[calc(100vh-60px)]" : ""}`}>
        {mainContent}
      </Main>
    </>
  )
}