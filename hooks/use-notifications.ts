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
    // Window-focus refetch is disabled: the GraphQL subscription (or fallback
    // poller) handles cache invalidation. Enabling this caused 4 redundant HTTP
    // calls per tab-switch when the hook was mounted in two places simultaneously.
    refetchOnWindowFocus: false,
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: queryKeys.notifications.stats(),
    queryFn: () => notificationsApi.getNotificationStats(),
    enabled,
    refetchOnWindowFocus: false,
  });

  // Subscribe to push notifications (GraphQL subscription) and invalidate queries
  // when a new notification arrives. The subscription-client module is a singleton
  // that fans out to multiple callers internally, so even if this hook is mounted
  // twice, only one WebSocket subscription is opened.
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let pollIntervalId: any = null;
    let cancelled = false;

    // Dynamic import to avoid SSR issues
    import('@/lib/subscription-client')
      .then(async (mod) => {
        if (cancelled) return;

        const result = await mod.subscribeToNotificationCreated((payload: any) => {
          const notification =
            payload?.data?.notificationCreated || payload?.notificationCreated;
          if (notification) {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          }
        });

        if (cancelled) {
          // Component unmounted before subscribe resolved — clean up immediately
          if (typeof result === 'function') result();
          return;
        }

        if (typeof result === 'function') {
          unsubRef.current = result;
        } else {
          // Subscription not available (null returned); fallback to polling
          pollIntervalId = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          }, 10000);
        }
      })
      .catch((err) => {
        console.error('[useNotifications] Failed to initialize subscription', err);
        if (!cancelled) {
          // Fallback to polling only if subscription setup failed
          pollIntervalId = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
          }, 10000);
        }
      });

    return () => {
      cancelled = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
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
