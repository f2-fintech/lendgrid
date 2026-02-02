import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi, NotificationFilterInput } from '@/lib/notifications-api'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

interface UseNotificationsProps {
  page?: number
  limit?: number
  filters?: NotificationFilterInput
  enabled?: boolean
  pollingInterval?: number // in milliseconds
}

/**
 * Fetch notifications with pagination, filters, and real-time polling
 */
export function useNotifications({
  page = 1,
  limit = 20,
  filters,
  enabled = true,
  pollingInterval = 1000000, // Poll every 10 minutes by default
}: UseNotificationsProps = {}) {
  const queryClient = useQueryClient()
  const previousUnreadCount = useRef<number>(0)

  // Fetch notifications
  const query = useQuery({
    queryKey: queryKeys.notifications.list({ page, limit, ...filters }),
    queryFn: () => notificationsApi.getNotifications({ page, limit, filters }),
    enabled,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
  })

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: queryKeys.notifications.stats(),
    queryFn: () => notificationsApi.getNotificationStats(),
    enabled,
    refetchInterval: pollingInterval,
    refetchOnWindowFocus: true,
  })

  // Show toast for new notifications
  useEffect(() => {
    if (query.data) {
      const currentUnreadCount = query.data.unreadCount

      // Only show toast if unread count increased (new notification)
      if (previousUnreadCount.current > 0 && currentUnreadCount > previousUnreadCount.current) {
        const newNotifications = query.data.data.filter(n => n.status === 'UNREAD')
        if (newNotifications.length > 0) {
          const latest = newNotifications[0]
          toast.info(latest.title, {
            description: latest.message,
            duration: 5000,
            action: latest.actionUrl ? {
              label: 'View',
              onClick: () => {
                if (latest.actionUrl) {
                  window.location.href = latest.actionUrl
                }
              },
            } : undefined,
          })
        }
      }

      previousUnreadCount.current = currentUnreadCount
    }
  }, [query.data])

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.success('All notifications marked as read')
    },
    onError: (error: Error) => {
      toast.error('Failed to mark all as read', {
        description: error.message,
      })
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
      toast.success('Notification deleted')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete notification', {
        description: error.message,
      })
    },
  })

  return {
    notifications: query.data?.data || [],
    total: query.data?.total || 0,
    unreadCount: query.data?.unreadCount || 0,
    pages: query.data?.pages || 0,
    stats: statsQuery.data || {
      totalNotifications: 0,
      unreadCount: 0,
      readCount: 0,
      commissionNotifications: 0,
      ticketNotifications: 0,
    },
    loading: query.isLoading || statsQuery.isLoading,
    error: query.error || statsQuery.error,
    refetch: () => {
      query.refetch()
      statsQuery.refetch()
    },
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
  }
}

/**
 * Get notification by ID
 */
export function useNotification(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: () => notificationsApi.getNotification(id),
    enabled: enabled && !!id,
  })
}
