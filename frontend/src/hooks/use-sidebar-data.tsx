import { useMemo } from 'react'
import { IconDatabase, IconPlus, IconClock } from '@tabler/icons-react'
import { useTableList } from '@/hooks/use-table-list'
import { type SidebarData } from '@/components/layout/types'
import { useSharedAnalysisHistory } from '@/context/analysis-history-context'
import Bars from '@/components/ui/shadcn-io/spinner/Bars'

export const useSidebarData = (): {
  data: SidebarData | null
  isLoading: boolean
  error: Error | null
} => {
  const { data: tables, isLoading, error } = useTableList()
  const { history } = useSharedAnalysisHistory()

  const sidebarData = useMemo((): SidebarData | null => {
    if (!tables) return null

    const hasUserDatabaseUrl = import.meta.env.USER_DATABASE_URL || ""

    return {
      navGroups: [
      {
        title: '',
        items: [
        {
          title: 'Database',
          icon: IconDatabase,
          items: [
          ...(hasUserDatabaseUrl == ""
            ? [
              {
              title: 'New Table',
              action: 'openModal' as const,
              icon: IconPlus,
              },
            ]
            : []),
          ...tables.map((table) => ({
            title: table.name,
            url: `/table/${table.name}` as any,
          })),
          ],
        },
        {
          title: 'Recent',
          icon: IconClock,
          items: [
          {
            title: 'New Analysis',
            url: '/' as any,
            icon: IconPlus,
          },
          ...history.map((item) => ({
            title: item.query,
            url: `/report/${item.id}` as any,
            ...(item.isLoading ? { icon: Bars } : {}),
          })),
          ...(history.length === 0
            ? [
              {
              title: 'No recent analyses',
              url: '#' as any,
              },
            ]
            : []),
          ],
        },
        ],
      },
      ],
    }
  }, [tables, history])

  return {
    data: sidebarData,
    isLoading,
    error,
  }
}
