import { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  NavCollapsible,
  NavItem,
  NavLink,
  NavAction,
  type NavGroup,
} from './types'

export function NavGroup({
  title,
  items,
  onModalOpen,
}: NavGroup & { onModalOpen?: (open: boolean) => void }) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url || item.action}`

          if (!item.items)
            return (
              <SidebarMenuLink
                key={key}
                item={item}
                href={href}
                onModalOpen={onModalOpen}
              />
            )

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item}
                href={href}
                onModalOpen={onModalOpen}
              />
            )

          return (
            <SidebarMenuCollapsible
              key={key}
              item={item}
              href={href}
              onModalOpen={onModalOpen}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
)

const SidebarMenuLink = ({
  item,
  href,
  onModalOpen,
}: {
  item: NavLink | NavAction
  href: string
  onModalOpen?: (open: boolean) => void
}) => {
  const { setOpenMobile } = useSidebar()

  if ('action' in item && item.action === 'openModal') {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => {
            onModalOpen?.(true)
            setOpenMobile(false)
          }}
          tooltip={item.title}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item as NavLink)}
        tooltip={item.title}
      >
        <Link to={(item as NavLink).url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const SidebarMenuCollapsible = ({
  item,
  href,
  onModalOpen,
}: {
  item: NavCollapsible
  href: string
  onModalOpen?: (open: boolean) => void
}) => {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible
      asChild
      // defaultOpen={checkIsActive(href, item, true)}
      defaultOpen={true}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                {'action' in subItem && subItem.action === 'openModal' ? (
                  <SidebarMenuSubButton
                    onClick={() => {
                      onModalOpen?.(true)
                      setOpenMobile(false)
                    }}
                  >
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                  </SidebarMenuSubButton>
                ) : (
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(href, subItem as any)}
                  >
                    <Link
                      to={(subItem as any).url}
                      onClick={() => setOpenMobile(false)}
                    >
                      {subItem.icon && <subItem.icon />}
                      <span>{subItem.title}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    </Link>
                  </SidebarMenuSubButton>
                )}
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
  onModalOpen,
}: {
  item: NavCollapsible
  href: string
  onModalOpen?: (open: boolean) => void
}) => {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item as any)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem
              key={`${sub.title}-${(sub as any).url || (sub as any).action}`}
              asChild={!('action' in sub)}
              onClick={
                'action' in sub && sub.action === 'openModal'
                  ? () => onModalOpen?.(true)
                  : undefined
              }
            >
              {'action' in sub && sub.action === 'openModal' ? (
                <div className='cursor-pointer'>
                  {sub.icon && <sub.icon />}
                  <span className='max-w-52 text-wrap'>{sub.title}</span>
                  {sub.badge && (
                    <span className='ml-auto text-xs'>{sub.badge}</span>
                  )}
                </div>
              ) : (
                <Link
                  to={(sub as any).url}
                  className={`${checkIsActive(href, sub as any) ? 'bg-secondary' : ''}`}
                >
                  {sub.icon && <sub.icon />}
                  <span className='max-w-52 text-wrap'>{sub.title}</span>
                  {sub.badge && (
                    <span className='ml-auto text-xs'>{sub.badge}</span>
                  )}
                </Link>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
