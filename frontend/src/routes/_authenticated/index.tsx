import { createFileRoute } from '@tanstack/react-router'
import NewAnalysis from '@/features/new-analysis'

export const Route = createFileRoute('/_authenticated/')({
  component: NewAnalysis,
})
