"use client"

import { useState } from "react"
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, Trash2, Filter, FileText, CreditCard } from 'lucide-react'
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationStatus, NotificationType } from "@/lib/notifications-api"

export function NotificationBar() {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [page, setPage] = useState(1)

  // Determine filters based on active tab
  const getFilters = () => {
    switch (activeTab) {
      case "unread":
        return { unreadOnly: true }
      case "commission":
        return { type: NotificationType.COMMISSION_STATUS_CHANGE }
      case "ticket":
        return { type: NotificationType.TICKET_STATUS_CHANGE }
      default:
        return {}
    }
  }

  const {
    notifications,
    unreadCount,
    total,
    pages,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    page,
    limit: 20,
    filters: getFilters(),
    pollingInterval: 1000000,
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-red-500 bg-red-500/10'
      case 'HIGH':
        return 'border-orange-500 bg-orange-500/10'
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-500/10'
      default:
        return 'border-blue-500 bg-blue-500/10'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'COMMISSION_STATUS_CHANGE':
        return <CreditCard className="h-5 w-5 text-green-400" />
      case 'TICKET_STATUS_CHANGE':
        return <FileText className="h-5 w-5 text-blue-400" />
      default:
        return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (notification.status === 'UNREAD') {
      markAsRead(notification._id)
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-start p-6">
      <Card className="w-full max-w-4xl bg-gray-800 shadow-2xl border border-gray-700 rounded-2xl">
        <CardHeader className="bg-gray-900 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="h-6 w-6" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {total} total notifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              <Link href="/">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  ← Back
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-bold text-white">{stats.totalNotifications}</p>
            </div>
            <div className="bg-gray-800 border border-blue-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Unread</p>
              <p className="text-lg font-bold text-blue-400">{stats.unreadCount}</p>
            </div>
            <div className="bg-gray-800 border border-green-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Commission</p>
              <p className="text-lg font-bold text-green-400">{stats.commissionNotifications}</p>
            </div>
            <div className="bg-gray-800 border border-purple-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Tickets</p>
              <p className="text-lg font-bold text-purple-400">{stats.ticketNotifications}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-gray-900 border-b border-gray-700 px-6 pt-4">
              <TabsList className="bg-gray-800 border border-gray-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
                  All ({total})
                </TabsTrigger>
                <TabsTrigger value="unread" className="data-[state=active]:bg-gray-700">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="commission" className="data-[state=active]:bg-gray-700">
                  Commission
                </TabsTrigger>
                <TabsTrigger value="ticket" className="data-[state=active]:bg-gray-700">
                  Tickets
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[calc(100vh-400px)]">
                {loading ? (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Bell className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-6 hover:bg-gray-700/30 cursor-pointer transition-all duration-200 relative group border-l-4 ${notification.status === 'UNREAD'
                          ? getPriorityColor(notification.priority)
                          : 'border-transparent'
                          }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-white">
                                  {notification.title}
                                </p>
                                {notification.status === 'UNREAD' && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 hover:bg-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification._id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <p className="text-sm text-gray-400">
                              {notification.message}
                            </p>

                            {(notification.oldStatus || notification.newStatus) && (
                              <div className="flex items-center gap-2 text-xs">
                                {notification.oldStatus && (
                                  <Badge variant="outline" className="border-gray-600 text-gray-400">
                                    {notification.oldStatus}
                                  </Badge>
                                )}
                                {notification.oldStatus && notification.newStatus && (
                                  <span className="text-gray-500">→</span>
                                )}
                                {notification.newStatus && (
                                  <Badge variant="outline" className="border-green-600 text-green-400">
                                    {notification.newStatus}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                              {notification.actionUrl && (
                                <Badge variant="secondary" className="text-xs">
                                  Click to view
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-700 p-4 bg-gray-900">
                  <p className="text-sm text-gray-400">
                    Page {page} of {pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
