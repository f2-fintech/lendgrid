import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  notificationsApi,
  NotificationFilterInput,
} from "@/lib/notifications-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

interface UseNotificationsProps {
  page?: number;
  limit?: number;
  filters?: NotificationFilterInput;
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
}

/**
 * Fetch notifications with pagination, filters, and real-time polling
 */
export function useNotifications({
  page = 1,
  limit = 20,
  filters,
  enabled = true,
  pollingInterval = 0,
}: UseNotificationsProps = {}) {
  const queryClient = useQueryClient();
  const previousUnreadCount = useRef<number>(0);
  const isFirstLoad = useRef<boolean>(true); 

  // Fetch notifications
  const query = useQuery({
    queryKey: queryKeys.notifications.list({ page, limit, ...filters }),
    queryFn: () => notificationsApi.getNotifications({ page, limit, filters }),
    enabled,
    refetchOnWindowFocus: true,
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: queryKeys.notifications.stats(),
    queryFn: () => notificationsApi.getNotificationStats(),
    enabled,
    refetchOnWindowFocus: true,
  });

  // Subscribe to push notifications (GraphQL subscription) and invalidate queries when new notification arrives
  // This replaces polling/refetch intervals
  useEffect(() => {
    if (!enabled) return;
    let unsub: (() => void) | null = null;
    let pollIntervalId: any = null;

    // dynamic import to avoid SSR issues
    import('@/lib/subscription-client')
      .then((mod) => {
        const result = mod.subscribeToNotificationCreated((payload: any) => {
          const notification = payload?.data?.notificationCreated || payload?.notificationCreated;
          if (notification) {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          }
        });

        if (typeof result === 'function') {
          unsub = result;
        } else {
          // subscription not available; fallback to polling
          pollIntervalId = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          }, 10000);
        }
      })
      .catch((err) => {
        console.error('Failed to initialize notifications subscription', err);
        // fallback to polling
        pollIntervalId = setInterval(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        }, 10000);
      });

    return () => {
      if (unsub) unsub();
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [enabled, queryClient]);

  // Show toast for new notifications
  useEffect(() => {
    if (query.data) {
      const currentUnreadCount = query.data.unreadCount;

      // ✅ FIXED: Only skip the toast if it's the very first time the page loads
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        previousUnreadCount.current = currentUnreadCount;
        return;
      }

      // ✅ FIXED: Now triggers safely even if the user previously had 0 notifications
      if (currentUnreadCount > previousUnreadCount.current) {
        const newNotifications = query.data.data.filter(
          (n: any) => n.status === "UNREAD",
        );
        if (newNotifications.length > 0) {
          const latest = newNotifications[0];
          toast.info(latest.title, {
            description: latest.message,
            duration: 5000,
            action: latest.actionUrl
              ? {
                  label: "View",
                  onClick: () => {
                    if (latest.actionUrl) {
                      window.location.href = latest.actionUrl;
                    }
                  },
                }
              : undefined,
          });
        }
      }

      previousUnreadCount.current = currentUnreadCount;
    }
  }, [query.data]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success("All notifications marked as read");
    },
    onError: (error: Error) => {
      toast.error("Failed to mark all as read", {
        description: error.message,
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success("Notification deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete notification", {
        description: error.message,
      });
    },
  });

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
      query.refetch();
      statsQuery.refetch();
    },
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
  };
}

/**
 * Get notification by ID
 */
export function useNotification(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id),
    queryFn: () => notificationsApi.getNotification(id),
    enabled: enabled && !!id,
  });
}
