import React from 'react'
import { useSidebarData } from '@/hooks/use-sidebar-data'
import { useTableList } from '@/hooks/use-table-list'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
    useSidebar

} from '@/components/ui/sidebar'
import { DatabaseConnectionModal } from '@/components/layout/database-connection-modal'
import { NavGroup } from '@/components/layout/nav-group'
import NewAnalysisBtn from './new-analysis-btn'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { open } = useSidebar()
  const { data: sidebarData, isLoading, error } = useSidebarData()
  const [modalOpen, setModalOpen] = React.useState(false)
  const {
    data: tables,
    isLoading: tablesLoading,
    error: tablesError,
  } = useTableList()

  // 初回起動時にtablesが空の場合、モーダルを開く
  React.useEffect(() => {
    if (tables && tables.length === 0 && !tablesLoading && !tablesError) {
      setModalOpen(true)
    }
  }, [tables, tablesLoading, tablesError])

  if (isLoading) {
    return (
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarHeader>
          <div className='px-3 py-2'>Loading...</div>
        </SidebarHeader>
        <SidebarContent>
          <div className='px-3 py-2'>Loading table list...</div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    )
  }

  if (error || !sidebarData) {
    return (
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarHeader>
          <div className='px-3 py-2'>Error</div>
        </SidebarHeader>
        <SidebarContent>
          <div className='px-3 py-2 text-red-500'>
            Failed to load table list.
            <br />
            Please ensure the server is running.
          </div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    )
  }

  return (
    <>
      <Sidebar collapsible='icon' variant='floating' {...props}>
        <SidebarHeader>
          {
            open ? (
              <div className='px-3 py-2 text-lg font-bold'>quelmap</div>
            ) : null
          }
        </SidebarHeader>
        <SidebarContent>
          <NewAnalysisBtn />
          {sidebarData.navGroups.map((props) => (
            <NavGroup key={props.title} {...props} onModalOpen={setModalOpen} />
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <DatabaseConnectionModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
