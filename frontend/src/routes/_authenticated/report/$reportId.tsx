import { createFileRoute } from '@tanstack/react-router'
import AnalysisEReport from '@/features/analysis-report'

export const Route = createFileRoute('/_authenticated/report/$reportId')({
  component: AnalysisEReport,
})
