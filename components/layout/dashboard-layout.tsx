"use client"

import { useState } from 'react'
import { useAuth, AppRole } from '@/lib/auth'
import { useLogout } from '@/lib/logout'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, TrendingUp, FileText, Settings, CreditCard, Building2, Users, BarChart3, Bell, LogOut, User, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { navigationPaths } from '@/lib/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: 'super_admin' | 'aggregator' | 'lender'
}

const navigationConfig = {
  super_admin: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: navigationPaths.superAdmin.dashboard, icon: LayoutDashboard },
        { title: "Platform Revenue", url: navigationPaths.superAdmin.revenue, icon: TrendingUp },
        { title: "Analytics", url: navigationPaths.superAdmin.analytics, icon: BarChart3 }
      ]
    },
    {
      title: "Management",
      items: [
        { title: "Lender Management", url: navigationPaths.superAdmin.lenders, icon: Building2 },
        { title: "Aggregator Management", url: navigationPaths.superAdmin.aggregators, icon: Users },
        { title: "Commission Rules", url: navigationPaths.superAdmin.commission, icon: CreditCard }
      ]
    },
    {
      title: "System",
      items: [
        { title: "Global Payouts", url: navigationPaths.superAdmin.payouts, icon: FileText },
        { title: "Settings", url: navigationPaths.superAdmin.settings, icon: Settings }
      ]
    }
  ],
  aggregator: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: navigationPaths.aggregator.dashboard, icon: LayoutDashboard },
        { title: "Commission", url: navigationPaths.aggregator.commission, icon: TrendingUp },
        { title: "Reports", url: navigationPaths.aggregator.reports, icon: FileText }
      ]
    },
    {
      title: "Management",
      items: [
        { title: "Applications", url: navigationPaths.aggregator.applications, icon: CreditCard },
        { title: "Settings", url: navigationPaths.aggregator.settings, icon: Settings }
      ]
    }
  ],
  lender: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: navigationPaths.lender.dashboard, icon: LayoutDashboard },
        { title: "Product Manager", url: navigationPaths.lender.products, icon: CreditCard },
        { title: "Aggregator Insights", url: navigationPaths.lender.insights, icon: BarChart3 }
      ]
    },
    {
      title: "Operations",
      items: [
        { title: "Payout Approval", url: navigationPaths.lender.payouts, icon: FileText },
        { title: "Settings", url: navigationPaths.lender.settings, icon: Settings }
      ]
    }
  ]
}

function AppSidebar({ userRole, user }: { userRole: DashboardLayoutProps['userRole'], user?: any }) {
  const router = useRouter()
  const logout = useLogout()
  const navigation = navigationConfig[userRole] || navigationConfig.lender

  if (!navigation || !Array.isArray(navigation)) {
    return (
      <Sidebar variant="inset" className="bg-gray-900 border-gray-800">
        <SidebarHeader>
          <div className="p-4 text-white">Loading...</div>
        </SidebarHeader>
      </Sidebar>
    )
  }

  const handleLogout = () => logout()

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'aggregator': return 'Aggregator Admin'
      case 'lender': return 'Lender Admin'
      default: return 'User'
    }
  }

  const displayName = user?.username || user?.email || 'User'
  const initials = (displayName || 'U')
    .split(' ')
    .map((s: string) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <Sidebar variant="inset" className="bg-gray-900 border-gray-800">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={navigationPaths.home}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-gold to-blue text-sidebar-primary-foreground">
                  <CreditCard className="size-4 text-dark" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-white">LendGrid</span>
                  <span className="truncate text-xs text-gray-400">Financial Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-gray-400">{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className="text-gray-300 hover:text-white hover:bg-gray-800">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.profilePicture || ''} alt={displayName} />
                    <AvatarFallback className="rounded-lg bg-gold text-dark">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-white">{displayName}</span>
                    <span className="truncate text-xs text-gray-400">{getRoleDisplayName(userRole)}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-gray-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-gray-800 border-gray-700"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { loading, role, user } = useAuth(['super_admin', 'aggregator_admin', 'lender_admin'] as AppRole[])
  const normalizedRole: 'super_admin' | 'aggregator' | 'lender' =
    role === 'super_admin' ? 'super_admin' : role === 'aggregator_admin' ? 'aggregator' : 'lender'

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole ?? normalizedRole} user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 bg-gray-900/50 backdrop-blur-md border-b border-gray-800">
          <SidebarTrigger className="-ml-1 text-white hover:bg-gray-800" />
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-gray-900/30 p-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
