import {
    SidebarMenu,
    SidebarMenuItem,
    useSidebar
} from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

export default function NewAnalysisBtn() {
    const { setOpenMobile, open } = useSidebar()
    return (
        <SidebarMenu>
            <SidebarMenuItem className='px-2'>
                    <Link to={"/"} className='rounded-2xl py-3 bg-accent hover:scale-102 transition-transform grid flex-1 text-left text-sm leading-tight' onClick={() => setOpenMobile(false)}>
                        {open ? (
                            <span className='truncate text-center font-semibold'>Start New Analysis</span>
                        ) : (
                            <div className='flex items-center justify-center'>
                                <Plus className='h-4 w-4 text-foreground' />
                            </div>
                        )}
                    </Link>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
