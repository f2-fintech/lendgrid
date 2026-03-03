"use client"

import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Settings,
  CreditCard,
  Users,
  BarChart3,
  Bell,
  LogOut,
  User,
  ChevronUp,
  X,
  Check,
  Trash2,
  Clock,
  User2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

import { useAuth, AppRole } from '@/lib/auth'
import { useLogout } from '@/lib/logout'
import { getEmployeeToken, getEmployeeRoleLabel, clearEmployeeToken, type DecodedEmployee } from '@/lib/employee-auth'
import { useNotifications } from '@/hooks/use-notifications'
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
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { navigationPaths } from '@/lib/navigation'
import { getCookie, decodeJwt } from "@/lib/utils"
import { ThemeLogo } from '@/components/theme-logo'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: 'super_admin' | 'aggregator' | 'aggregator_member' | 'lender' | 'hrms_employee'
}

const navigationConfig = {
  super_admin: [
    // {
    //   title: "Overview",
    //   items: [
    //     { title: "Analytics", url: navigationPaths.superAdmin.analytics, icon: BarChart3 },
    //     { title: "Platform Revenue", url: navigationPaths.superAdmin.revenue, icon: TrendingUp },
    //     { title: "Product Manager", url: navigationPaths.superAdmin.products, icon: CreditCard },
    //   ]
    // },
    {
      title: "Management",
      items: [
        { title: "Dashboard", url: navigationPaths.superAdmin.dashboard, icon: LayoutDashboard },
        { title: "Aggregator Management", url: navigationPaths.superAdmin.aggregators, icon: User2 },
        { title: "Commission Rules", url: navigationPaths.superAdmin.commission, icon: CreditCard },
        { title: "Commission Payouts", url: navigationPaths.superAdmin.payouts, icon: FileText },
        { title: "F2fintech Employees", url: navigationPaths.superAdmin.f2fintechEmployees, icon: Users }
        // { title: "Settings", url: navigationPaths.superAdmin.settings, icon: Settings }
        // { title: "Lender Management", url: navigationPaths.superAdmin.lenders, icon: Building2 },
      ]
    },
    // {
    //   title: "System",
    //   items: [
    //   ]
    // }
  ],
  aggregator: (isOmsEnabled: boolean) => [
    // {
    //   title: "Overview",
    //   items: [
    //     { title: "Products", url: navigationPaths.aggregator.products, icon: CreditCard },
    //     { title: "Reports", url: navigationPaths.aggregator.reports, icon: FileText }
    //   ]
    // },
    {
      title: "Management",
      items: [
        { title: "Dashboard", url: navigationPaths.aggregator.dashboard, icon: LayoutDashboard },
        { title: "Applications", url: navigationPaths.aggregator.applications, icon: FileText },
        { title: "Commission", url: navigationPaths.aggregator.commission, icon: TrendingUp },
        { title: "Profile Settings", url: navigationPaths.aggregator.settings, icon: Settings },
        // ...(isOmsEnabled
        //   ? [{ title: "OMS", url: `https://admin-f2fintech.netlify.app/login`, icon: Building2 }]
        //   : [])
      ]
    }
  ],
  aggregator_member: [
    {
      title: "Operations",
      items: [
        { title: "Dashboard", url: navigationPaths.aggregatorMember.dashboard, icon: LayoutDashboard },
        { title: "Products", url: navigationPaths.aggregatorMember.products, icon: CreditCard },
        { title: "Applications", url: navigationPaths.aggregatorMember.applications, icon: FileText },
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
        { title: "Applications", url: navigationPaths.lender.applications, icon: CreditCard },
        { title: "Payout Approval", url: navigationPaths.lender.payouts, icon: FileText },
        { title: "Settings", url: navigationPaths.lender.settings, icon: Settings }
      ]
    }
  ],
  hrms_employee: [
    {
      title: "Workspace",
      items: [
        { title: "Dashboard", url: navigationPaths.f2fintechEmployee.dashboard, icon: LayoutDashboard },
        { title: "Profile", url: navigationPaths.f2fintechEmployee.profile, icon: User2 },
        { title: "Performance", url: navigationPaths.f2fintechEmployee.performance, icon: TrendingUp },
      ]
    }
  ]
}

function AppSidebar({
  userRole,
  user,
  isOmsEnabled
}: {
  userRole: 'super_admin' | 'aggregator' | 'aggregator_member' | 'lender' | 'hrms_employee',
  user?: any,
  isOmsEnabled?: boolean
}) {
  const router = useRouter()
  const logout = useLogout()
  let navigation;

  if (userRole === "aggregator") {
    navigation = navigationConfig.aggregator(isOmsEnabled!);
  } else {
    navigation = navigationConfig[userRole];
  }

  const handleLogout = () => {
    if (userRole === 'hrms_employee') {
      clearEmployeeToken()
      router.replace('/login')
    } else {
      logout()
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'aggregator': return 'Aggregator Admin'
      case 'aggregator_member': return 'Aggregator Member'
      case 'lender': return 'Lender Admin'
      case 'hrms_employee': return getEmployeeRoleLabel(user?.rawRole ?? '3')
      default: return 'User'
    }
  }

  const displayName = user?.username || user?.email || 'User'
  const initials = (displayName || 'U')
    .split(' ')
    .map((s: string) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  if (!navigation || !Array.isArray(navigation)) {
    return (
      <Sidebar variant="inset" className="professional-sidebar">
        <SidebarHeader>
          <div className="p-4 text-sidebar-foreground">Loading...</div>
        </SidebarHeader>
      </Sidebar>
    )
  }

  return (
    <Sidebar variant="inset" className="professional-sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={navigationPaths.home}>
                <div className="flex items-center gap-3">
                  <ThemeLogo
                    alt="F2Fintech Logo"
                    className="w-12 h-12 object-contain"
                  />

                  <span className="text-2xl font-bold tracking-wide text-primary">
                    LendGrid
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item: { url: string; icon: React.ElementType; title: string }) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
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
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.profilePicture || ''} alt={displayName} />
                    <AvatarFallback className="rounded-lg bg-accent text-accent-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{getRoleDisplayName(userRole)}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
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
  const [showNotifications, setShowNotifications] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  // Detect employee session first (employee_token cookie)
  const employeeToken = getEmployeeToken()
  const decodedEmployee: DecodedEmployee | null = employeeToken ? decodeJwt(employeeToken) as DecodedEmployee : null
  const isEmployeeSession = decodedEmployee?.type === 'hrms_employee'

  const { loading, role, user } = useAuth(['super_admin', 'aggregator_admin', 'aggregator_member', 'lender_admin'] as AppRole[])
  const normalizedRole: 'super_admin' | 'aggregator' | 'aggregator_member' | 'lender' | 'hrms_employee' =
    isEmployeeSession ? 'hrms_employee'
      : role === 'super_admin' ? 'super_admin'
        : role === 'aggregator_admin' ? 'aggregator'
          : role === 'aggregator_member' ? 'aggregator_member'
            : 'lender'
  const token = getCookie("token")
  const decoded = decodeJwt(token)
  const isOmsEnabled = decoded?.isOmsEnabled ?? false

  // Build employee user object for sidebar display
  const employeeUser = isEmployeeSession && decodedEmployee ? {
    username: `${decodedEmployee.first_name} ${decodedEmployee.last_name}`.trim(),
    email: decodedEmployee.email,
    profilePicture: decodedEmployee.image,
    rawRole: decodedEmployee.role,  // role_priority: '1'|'2'|'3'
  } : null

  // Use notifications hook with polling
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    page: 1,
    limit: 10,
    pollingInterval: 1000000,   // Poll every 10 minutes
  })

  useEffect(() => {
    refetch()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showNotifications])

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (notification.status === 'UNREAD') {
      markAsRead(notification._id)
    }

    // Navigate to action URL if exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setShowNotifications(false)
    }
  }

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    deleteNotification(notificationId)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-500'
      case 'HIGH':
        return 'text-orange-500'
      case 'MEDIUM':
        return 'text-yellow-500'
      default:
        return 'text-blue-500'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'COMMISSION_STATUS_CHANGE':
        return <CreditCard className="h-4 w-4" />
      case 'TICKET_STATUS_CHANGE':
        return <FileText className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  if (loading) {
    return <div className="p-8 text-foreground">Loading...</div>
  }

  return (
    <SidebarProvider>
      <AppSidebar
        userRole={userRole ?? normalizedRole}
        user={isEmployeeSession ? employeeUser : user}
        isOmsEnabled={isOmsEnabled}
      />

      <SidebarInset className="w-full h-full bg-background !p-0 !m-0">
        <header className="professional-header flex h-16 items-center gap-2 px-4 sticky top-0 z-50">
          <SidebarTrigger className="-ml-1" />

          <div className="ml-auto flex items-center space-x-2 relative">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notification Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications((p) => !p)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive hover:bg-destructive notification-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <div ref={panelRef} className="absolute right-0 top-14 w-[420px] z-50">
                <Card className="glass-effect shadow-2xl rounded-2xl overflow-hidden">
                  <CardHeader className="border-b border-border py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                          <Badge className="bg-destructive hover:bg-destructive px-2 py-0.5 text-xs">
                            {unreadCount} new
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs h-8 px-3"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowNotifications(false)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <ScrollArea className="h-[450px]">
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center h-[450px]">
                        <div className="flex flex-col items-center gap-3">
                          <div className="professional-spinner h-10 w-10" />
                          <p className="text-sm text-muted-foreground">Loading notifications...</p>
                        </div>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[450px] px-6">
                        <div className="p-4 bg-muted rounded-full mb-4">
                          <Bell className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <p className="text-base font-medium mb-1">No notifications yet</p>
                        <p className="text-sm text-muted-foreground text-center">
                          We'll notify you when something important happens
                        </p>
                      </div>
                    ) : (
                      <CardContent className="p-0">
                        {notifications.map((notification, index) => {
                          const isUnread = notification.status === 'UNREAD'
                          const isHighPriority = notification.priority === 'HIGH' || notification.priority === 'URGENT'
                          const priorityColor = notification.priority === 'URGENT' ? 'text-red-400' :
                            notification.priority === 'HIGH' ? 'text-orange-400' : 'text-blue-400'

                          return (
                            <div key={notification._id}>
                              <div className={`relative p-4 hover:bg-muted/50 cursor-pointer transition-all group ${isUnread ? 'bg-primary/10 border-l-4 border-primary' : 'bg-transparent border-l-4 border-transparent'}`}
                                onClick={() => handleNotificationClick(notification)}>
                                {isUnread && isHighPriority && (
                                  <div className="absolute top-2 right-2">
                                    <div className={`w-2 h-2 rounded-full ${notification.priority === 'URGENT' ? 'bg-destructive animate-pulse' : 'bg-orange-500'}`} title={notification.priority} />
                                  </div>
                                )}

                                <div className="flex items-start gap-3">
                                  {/* Content */}
                                  <div className="flex-1 space-y-1.5 min-w-0 pr-6">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-semibold ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {notification.title}
                                      </p>
                                      {isUnread &&
                                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5 shadow-lg shadow-primary/50" />}
                                    </div>
                                    <p className={`text-xs leading-relaxed ${isUnread ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between pt-1">
                                      <p className="text-xs flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                          addSuffix: true,
                                        })}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                        onClick={(e) => handleDeleteNotification(e, notification._id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {index < notifications.length - 1 && (
                                <Separator />
                              )}
                            </div>
                          )
                        })}
                      </CardContent>
                    )}
                  </ScrollArea>

                  {/* {notifications.length > 0 && (
                    <div className="border-t border-gray-700/50 p-3 bg-gradient-to-r from-gray-900 to-gray-800">
                      <Button
                        variant="ghost"
                        className="w-full text-foreground hover:text-cyan-300 hover:bg-gray-700/50 text-sm font-medium rounded-lg h-9"
                        onClick={() => {
                          setShowNotifications(false)
                          if (normalizedRole === "super_admin") router.push(navigationPaths.superAdmin.payouts)
                          else if (normalizedRole === "aggregator") router.push(navigationPaths.aggregator.commission)
                          else router.push("/lender/notification")
                        }}
                      >
                        View all notifications
                        <span className="ml-2">→</span>
                      </Button>
                    </div>
                  )} */}
                </Card>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 w-full min-h-screen bg-background !p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
