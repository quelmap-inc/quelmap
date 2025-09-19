import { createFileRoute } from '@tanstack/react-router'
import TablePreview from '@/features/table-preview'

export const Route = createFileRoute('/_authenticated/table/$tableName')({
  component: TablePreview,
})
