import { Download, ChevronDown, Printer, RotateCcwIcon,Code } from 'lucide-react'
import {
  type ReportContent as ReportContentType,
  type ActionStep,
} from '@/hooks/use-analysis'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageZoom } from '@/components/ui/kibo-ui/image-zoom'
import { AIResponse } from '@/components/ui/kibo-ui/response'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
// import { A } from 'node_modules/@faker-js/faker/dist/airline-CLphikKp';

interface ReportContentProps {
  content: ReportContentType[]
  pythonCode?: string
  steps?: ActionStep[]
  onShowSidePanel: (content: {
    type: 'code' | 'table' | 'step'
    content: string
    stepData?: ActionStep
  }) => void
  handleRedoClick: () => void
}


export function ReportContent({
  content,
  pythonCode,
  steps,
  onShowSidePanel,
  handleRedoClick,
}: ReportContentProps) {
  console.log(
    'ReportContent rendered with steps:',
    steps,
    'pythonCode:',
    pythonCode
  )
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `report_${Date.now()}`,
    pageStyle: `
      @page { size: A4; margin: 16mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
  })

  const handlePrintClick = () => {
    const node = printRef.current
    console.log('[ReportContent] print click. ref?', node)
    if (!node) {
      console.warn('[ReportContent] There is nothing to print: ref is null')
      return
    }
    const rect = node.getBoundingClientRect()
    if (rect.height === 0 || rect.width === 0) {
      console.warn('[ReportContent] There is nothing to print: printable area has zero size', rect)
      return
    }
    try {
      handlePrint()
    } catch (e) {
      console.error('[ReportContent] handlePrint failed, fallback to window.print()', e)
      window.print()
    }
  }

  return (

    <div className='space-y-6'>
      <div className='flex justify-start no-print'>
        {/* Python Code Button */}
        {pythonCode && (
          <Button
            variant='link'
            onClick={() =>
              onShowSidePanel({ type: 'code', content: pythonCode })
            }
            className='flex items-center gap-2'
          >
            <ChevronDown className='h-4 w-4' />
            Python Code
          </Button>
        )}
      </div>


      <div ref={printRef} className='p-0 m-0'>
        {/* Steps Section */}
        {steps && steps.length > 0 && (
          <div className='space-y-2'>
            <div className='mb-4 flex items-center gap-2'>
              <h3 className='text-muted-foreground text-sm font-medium'>
                Action Steps
              </h3>
              <Badge variant='secondary' className='text-xs'>
                {steps.length} steps
              </Badge>
            </div>
            <div className=''>
              {steps.map((step, index) => (
                <StepItem
                  key={index}
                  step={step}
                  stepNumber={index + 1}
                  onShowSidePanel={onShowSidePanel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Spacer if no content */}
        {content.length === 0 && (
          <div className="h-[calc(100vh-450px)]" />
        )}

        {/* Content Blocks */}
        {content.map((block, index) => (
          <ContentBlock
            key={index}
            block={block}
            onShowSidePanel={onShowSidePanel}
          />
        ))}

      </div>
      {/* Footer */}
      {content.length > 0 && (
        <div className='w-full flex gap-5 mt-3 text-muted-foreground'>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRedoClick}
                className='underline hover:text-foreground'
              >
                <RotateCcwIcon className='inline-block w-5 h-5' />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handlePrintClick}
                className='underline hover:text-foreground'
              >
                <Printer className='inline-block w-5 h-5' />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Print out</p>
            </TooltipContent>
          </Tooltip>
        </div>)
      }

    </div>
  )
}

interface ContentBlockProps {
  block: ReportContentType
  onShowSidePanel: (content: {
    type: 'code' | 'table' | 'step'
    content: string
    stepData?: ActionStep
  }) => void
}

interface StepItemProps {
  step: ActionStep
  stepNumber: number
  onShowSidePanel: (content: {
    type: 'code' | 'table' | 'step'
    content: string
    stepData?: ActionStep
  }) => void
}

function StepItem({ step, stepNumber, onShowSidePanel }: StepItemProps) {
  const handleStepClick = () => {
    onShowSidePanel({
      type: 'step',
      content: step.python ? step.python : '',
      stepData: step,
    })
  }

  return (
    <div
      className='group border-border/50 hover:border-border hover:bg-accent/50 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all duration-200'
      onClick={handleStepClick}
    >
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <div className='flex-shrink-0'>
          <div className='bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full'>
            <span className='text-primary text-xs font-medium'>
              {stepNumber}
            </span>
          </div>
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-foreground group-hover:text-primary truncate text-sm font-medium transition-colors'>
            {step.query}
          </p>
        </div>
      </div>
      <div className='flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100'>
        <Code className='text-muted-foreground h-4 w-4' />
      </div>
    </div>
  )
}

function ContentBlock({ block, onShowSidePanel }: ContentBlockProps) {
  switch (block.type) {
    case 'markdown':
      return <MarkdownBlock content={block.content} />

    case 'variable':
      return <VariableBlock data={block.data} />

    case 'image':
      return <ImageBlock base64={block.base64} />

    case 'table':
      return (
        <TableBlock table={block.table} onShowSidePanel={onShowSidePanel} />
      )

    default:
      return null
  }
}

function MarkdownBlock({ content }: { content: string }) {
  return <AIResponse>{content}</AIResponse>
}

function VariableBlock({ data }: { data: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='inline-block text-lg font-bold'>{data}</span>
        </TooltipTrigger>
        <TooltipContent>
          {/* Indicates this value was derived from actual analysis, not hallucination */}
          <p>Analyzed result</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ImageBlock({ base64 }: { base64: string }) {
  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${base64}`
    link.download = `chart_${Date.now()}.png`
    link.click()
  }

  return (
    <div>
      <ImageZoom>
        <img
          src={`data:image/png;base64,${base64}`}
          alt='Analysis Chart'
          className='h-auto w-full rounded border'
        />
      </ImageZoom>
      <div className='mt-2 flex justify-end'>
        <Button
          variant='outline'
          size='sm'
          onClick={downloadImage}
          className='flex items-center gap-2'
        >
          <Download className='h-4 w-4' />
          PNG
        </Button>
      </div>
    </div>
  )
}

function TableBlock({
  table,
  onShowSidePanel,
}: {
  table: string
  onShowSidePanel: (content: {
    type: 'code' | 'table' | 'step'
    content: string
    stepData?: ActionStep
  }) => void
}) {
  // const [showPreview, setShowPreview] = useState(false)

  // Parse table data in JSON format (following API spec)
  console.log('### Table Detected:')
  console.log(table)
  const data = JSON.parse(table) as any[]
  const columns = data.length > 0 ? Object.keys(data[0]) : []
  const maxRows = 4
  const previewData = data.slice(0, maxRows + 1)

  // Convert JSON to CSV
  const convertToCSV = (jsonData: any[]) => {
    if (jsonData.length === 0) return ''

    const headers = Object.keys(jsonData[0])
    const csvRows = [
      headers.join(','),
      ...jsonData.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // CSV escaping
            if (
              typeof value === 'string' &&
              (value.includes(',') ||
                value.includes('"') ||
                value.includes('\n'))
            ) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(',')
      ),
    ]
    return csvRows.join('\n')
  }
  return (
    <div>
      <div
        className='relative transition hover:shadow'
        onClick={() =>
          onShowSidePanel({ type: 'table', content: convertToCSV(data) })
        }
      >
        <div className='mb-5 max-h-96 overflow-auto rounded-xl border print:shadow-none transition-all hover:shadow-md'>
          {/* <p>{data.length} rows of data</p> */}
          <Table className='pointer-events-none'>
            <TableHeader>
              <TableRow>
                {columns.map((header, index) => (
                  <TableHead key={index} className='whitespace-nowrap'>
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, cellIndex) => (
                    <TableCell key={cellIndex} className='whitespace-nowrap'>
                      {String(row[column] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length > maxRows && (
            <div className="print:hidden pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-xl bg-gradient-to-t from-background via-background/80 to-transparent">
              <div className="text-muted-foreground absolute bottom-2 mt-2 w-full text-center text-sm">
                ... showing {data.length - maxRows} more rows
              </div>
            </div>
          )}
        </div>
      </div>
     
    </div>
  )
}
