import { LinkProps } from '@tanstack/react-router'

interface BaseNavItem {
  title: string
  badge?: string
  icon?: React.ElementType
}

type NavLink = BaseNavItem & {
  url: LinkProps['to']
  items?: never
  action?: never
}

type NavAction = BaseNavItem & {
  action: 'openModal'
  url?: never
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: ((BaseNavItem & { url: LinkProps['to'] }) | NavAction)[]
  url?: never
  action?: never
}

type NavItem = NavCollapsible | NavLink | NavAction

interface NavGroup {
  title: string
  items: NavItem[]
}

interface SidebarData {
  navGroups: NavGroup[]
}

export type {
  SidebarData,
  NavGroup,
  NavItem,
  NavCollapsible,
  NavLink,
  NavAction,
}
