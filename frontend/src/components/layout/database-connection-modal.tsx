import type React from 'react'
import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

type ConnectionType = 'files' | 'postgres' | 'sqlite' | null
type Step = 'selection' | 'input' | 'connecting' | 'success' | 'error'

interface DatabaseConnectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ConnectionResult {
  table_count: number
  table_names: string[]
  message: string
}

interface ErrorResult {
  detail: string 
}

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'

export function DatabaseConnectionModal({
  open,
  onOpenChange,
}: DatabaseConnectionModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('selection')
  const [connectionType, setConnectionType] = useState<ConnectionType>(null)
  const [progress, setProgress] = useState(0)
  const [connectionString, setConnectionString] = useState('')
  const [tableCount, setTableCount] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [tableNames, setTableNames] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const connectionOptions = [
    {
      id: 'files' as ConnectionType,
      title: 'XLSX, CSV Files',
      description: 'Upload spreadsheet files to load data',
      image: '/images/xlsx-csv-icon.png',
      icon: FileSpreadsheet,
    },
    {
      id: 'postgres' as ConnectionType,
      title: 'PostgreSQL Connection String',
      description: 'Load data from an external PostgreSQL database',
      image: '/images/postgres-icon.png',
      icon: Database,
    },
    {
      id: 'sqlite' as ConnectionType,
      title: 'SQLite .db File',
      description: 'Upload a SQLite database file to load data',
      image: '/images/sqlite-icon.png',
      icon: Upload,
    },
  ]

  const handleOptionSelect = (type: ConnectionType) => {
    setConnectionType(type)
    setStep('input')
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files)
  setFiles((prev: File[]) => [...prev, ...droppedFiles])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
  setFiles((prev: File[]) => [...prev, ...selectedFiles])
    }
  }

  const callApi = async (
    endpoint: string,
    method: string,
    body?: FormData | null
  ) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: method,
      body: body,
    })

    if (!response.ok) {
      const errorData: ErrorResult = await response.json()
      throw new Error(errorData.detail || 'API request failed')
    }

    return response.json()
  }

  const handleConnection = async () => {
    setStep('connecting')
    setProgress(0)
    setIsLoading(true)

    try {
  // Start progress bar animation
      const progressInterval = setInterval(() => {
  setProgress((prev: number) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      let result: ConnectionResult

  // Call API depending on connection type
      switch (connectionType) {
        case 'files': {
          const formData = new FormData()
          files.forEach((file: File) => {
            formData.append('files', file)
          })
          result = await callApi('/api/upload-csv-xlsx', 'POST', formData)
          break
        }
        case 'postgres': {
          const formData = new FormData()
          formData.append('connection_string', connectionString)
          result = await callApi(
            '/api/connect-external-postgres',
            'POST',
            formData
          )
          break
        }
        case 'sqlite': {
          const formData = new FormData()
          formData.append('file', files[0])
          result = await callApi('/api/upload-sqlite-db', 'POST', formData)
          break
        }
        default:
          throw new Error('無効な接続タイプです')
      }

  // Complete progress bar
      clearInterval(progressInterval)
      setProgress(100)

  // Set results
      setTableCount(result.table_count)
      setTableNames(result.table_names)
      setSuccessMessage(result.message)

  // After a short delay, transition to success screen
      setTimeout(() => {
        setStep('success')
        setIsLoading(false)
        // データベース更新後にキャッシュを無効化
        invalidateQueries()
      }, 500)
    } catch (error) {
      setIsLoading(false)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred'
      )
      setErrorDetails(error instanceof Error ? error.stack || '' : '')
      setStep('error')
    }
  }

  const resetModal = () => {
    setStep('selection')
    setConnectionType(null)
    setProgress(0)
    setTableCount(0)
    setTableNames([])
    setFiles([])
    setErrorMessage('')
    setConnectionString('')
    setErrorDetails('')
    setSuccessMessage('')
    setIsLoading(false)
  }

  // Function to invalidate cache after database update
  const invalidateQueries = () => {
    // Invalidate table list cache
    queryClient.invalidateQueries({ queryKey: ['tableList'] })
    // Invalidate all table data cache
    queryClient.invalidateQueries({ queryKey: ['tableData'] })
    // Notify user
    toast.success('Database updated')
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      // 成功後にモーダルが閉じられる場合は、キャッシュを無効化
      if (step === 'success') {
        invalidateQueries()
      }
      resetModal()
    }
    onOpenChange(open)
  }

  const retryConnection = () => {
    setStep('input')
    setErrorMessage('')
    setErrorDetails('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[80vh] min-w-4xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-center text-2xl font-bold'>
            Upload Your Data <span className='text-sm font-normal text-neutral-400'> All data stored and proceeded locally</span>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode='wait'>
          {step === 'selection' && (
            <motion.div
              key='selection'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='py-4'
            >
              <div className='option-container flex h-80 gap-4'>
                {connectionOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    className='group option-item relative flex-1 cursor-pointer overflow-hidden rounded-lg'
                    whileHover='hover'
                    initial='initial'
                    variants={{
                      initial: { flex: 1 },
                      hover: { flex: 1.2 },
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <div className='absolute inset-0'>
                      <img
                        src={option.image || '/placeholder.svg'}
                        alt={option.title}
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
                    <div className='absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10' />
                    <div className='absolute inset-0 flex flex-col justify-end p-6 text-white'>
                      <motion.div
                        variants={{
                          initial: { y: 0, opacity: 0.9 },
                          hover: { y: -10, opacity: 1 },
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className='mb-3'>
                          <option.icon className='mb-2 h-8 w-8' />
                        </div>
                        <h3 className='mb-2 text-lg leading-tight font-bold'>
                          {option.title}
                        </h3>
                        <p className='text-sm leading-relaxed text-white/90'>
                          {option.description}
                        </p>
                      </motion.div>
                    </div>
                    <div className='absolute inset-0 rounded-lg border-2 border-transparent transition-colors duration-300 group-hover:border-white/30' />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'input' && connectionType === 'files' && (
            <motion.div
              key='files-input'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='py-4'
            >
              <div
                className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='mb-2 text-lg font-medium'>
                  Drag & Drop Files
                </p>
                <p className='text-muted-foreground mb-4'>or</p>
                <Input
                  type='file'
                  multiple
                  accept='.xlsx,.xls,.csv'
                  onChange={handleFileInput}
                  className='hidden'
                  id='file-upload'
                />
                <Label
                  htmlFor='file-upload'
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'cursor-pointer bg-transparent',
                  })}
                >
                  Choose Files
                </Label>
              </div>

              {files.length > 0 && (
                <div className='mt-4'>
                  <h4 className='mb-2 font-medium'>Selected Files:</h4>
                  <div className='space-y-2'>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className='bg-muted flex items-center justify-between rounded p-2'
                      >
                        <span className='text-sm'>{file.name}</span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            setFiles(files.filter((_, i) => i !== index))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='mt-6 flex justify-between'>
                <Button variant='outline' onClick={() => setStep('selection')}>
                  Back
                </Button>
                <Button
                  onClick={handleConnection}
                  disabled={files.length === 0 || isLoading}
                >
                  {isLoading ? 'Processing...' : 'Load Data'}
                </Button>
              </div>
            </motion.div>
          )}
          {step === 'input' && connectionType === 'postgres' && (
            <motion.div
              key='postgres-input'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-4 py-4'
            >
              <div>
                <Label htmlFor='connection-string'>PostgreSQL Connection String</Label>
                <Input
                  id='connection-string'
                  placeholder='postgresql://username:password@localhost:5432/database'
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  className='mt-1'
                />
                <p className='text-muted-foreground mt-1 text-sm'>
                  Example: postgresql://user:pass@localhost:5432/mydb
                </p>
              </div>

              <div className='rounded-md border border-blue-200 bg-blue-50 p-3'>
                <p className='text-sm text-blue-700'>
                  <strong>Note:</strong>{' '}
                  All table data will be loaded from the external PostgreSQL database and stored locally.
                </p>
              </div>

              <div className='mt-6 flex justify-between'>
                <Button variant='outline' onClick={() => setStep('selection')}>
                  Back
                </Button>
                <Button
                  onClick={handleConnection}
                  disabled={!connectionString.trim() || isLoading}
                >
                  {isLoading
                    ? 'Loading data...'
                    : 'Connect and Load Data'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'input' && connectionType === 'sqlite' && (
            <motion.div
              key='sqlite-input'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='py-4'
            >
              <div
                className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Database className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='mb-2 text-lg font-medium'>
                  Drag & Drop SQLite File
                </p>
                <p className='text-muted-foreground mb-4'>or</p>
                <Input
                  type='file'
                  accept='.db,.sqlite,.sqlite3'
                  onChange={handleFileInput}
                  className='hidden'
                  id='sqlite-upload'
                />
                <Label
                  htmlFor='sqlite-upload'
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'cursor-pointer bg-transparent',
                  })}
                >
                  Choose .db File
                </Label>
              </div>

              {files.length > 0 && (
                <div className='mt-4'>
                  <div className='bg-muted flex items-center justify-between rounded p-2'>
                    <span className='text-sm'>{files[0].name}</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setFiles([])}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <div className='mt-6 flex justify-between'>
                <Button variant='outline' onClick={() => setStep('selection')}>
                  Back
                </Button>
                <Button
                  onClick={handleConnection}
                  disabled={files.length === 0 || isLoading}
                >
                  {isLoading ? 'Loading data...' : 'Load Data'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div
              key='connecting'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-6 py-8 text-center'
            >
              <div className='space-y-4'>
                <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
                <h3 className='text-xl font-semibold'>Loading data...</h3>
                <p className='text-muted-foreground'>
                  {connectionType === 'postgres' &&
                    'Loading data from external PostgreSQL'}
                  {connectionType === 'sqlite' &&
                    'Loading data from SQLite file'}
                  {connectionType === 'files' &&
                    'Loading data from files'}
                </p>
              </div>

              <div className='space-y-2'>
                <Progress value={progress} className='w-full' />
                <p className='text-muted-foreground text-sm'>{progress}%</p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key='success'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-6 py-8 text-center'
            >
              <div className='space-y-4'>
                <CheckCircle className='mx-auto h-16 w-16 text-green-500' />
                <h3 className='text-xl font-semibold text-green-600'>
                  Data Load Complete!
                </h3>
                <p className='text-lg'>
                  Loaded <span className='font-semibold'>{tableCount}</span>
                  {' '}tables
                </p>
                {/* <p className="text-sm text-muted-foreground">サイドバーのテーブル一覧が更新されます</p> */}
                {successMessage && (
                  <p className='text-muted-foreground text-sm'>
                    {successMessage}
                  </p>
                )}
              </div>

              <div className='mx-auto max-w-md'>
                {/* <h4 className="text-sm font-medium text-muted-foreground mb-3">読み込まれたテーブル:</h4> */}
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  {tableNames.map((tableName, index) => (
                    <motion.div
                      key={tableName}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='bg-muted/50 rounded-md px-3 py-2 text-left font-mono'
                    >
                      {tableName}
                    </motion.div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  invalidateQueries()
                  handleClose(false)
                }}
                className='w-full'
              >
                Done
              </Button>
            </motion.div>
          )}

          {step === 'error' && (
            <motion.div
              key='error'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className='space-y-6 py-8 text-center'
            >
              <div className='space-y-4'>
                <AlertCircle className='mx-auto h-16 w-16 text-red-500' />
                <h3 className='text-xl font-semibold text-red-600'>
                  Connection Error
                </h3>
                <div className='mx-auto max-w-md text-left'>
                  <p className='mb-2 text-sm font-medium text-red-600'>
                    Error Message:
                  </p>
                  <div className='rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                    {errorMessage}
                  </div>
                  {errorDetails && (
                    <details className='mt-3'>
                      <summary className='text-muted-foreground cursor-pointer text-sm font-medium'>
                        Details
                      </summary>
                      <div className='bg-muted text-muted-foreground mt-2 max-h-32 overflow-y-auto rounded-md p-3 font-mono text-xs'>
                        {errorDetails}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              <div className='flex justify-center gap-3'>
                <Button variant='outline' onClick={() => setStep('selection')}>
                  Back to Start
                </Button>
                <Button
                  onClick={retryConnection}
                  className='flex items-center gap-2'
                >
                  <RefreshCw className='h-4 w-4' />
                  Retry
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
      <style>{`
        .option-container:hover .option-item:not(:hover) {
          flex: 0.8 !important;
        }
      `}</style>
    </Dialog>
  )
}
