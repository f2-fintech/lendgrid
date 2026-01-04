import { gqlFetch } from './http-client'

export enum NotificationType {
    COMMISSION_STATUS_CHANGE = 'COMMISSION_STATUS_CHANGE',
    TICKET_STATUS_CHANGE = 'TICKET_STATUS_CHANGE',
}

export enum NotificationStatus {
    UNREAD = 'UNREAD',
    READ = 'READ',
    ARCHIVED = 'ARCHIVED',
}

export enum NotificationPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export interface Notification {
    _id: string
    type: NotificationType
    recipientId: string
    companyId: number
    title: string
    message: string
    status: NotificationStatus
    priority: NotificationPriority
    commissionTransactionId?: string
    ticketId?: number
    oldStatus?: string
    newStatus?: string
    actionUrl?: string
    emailSent: boolean
    emailSentAt?: string
    readAt?: string
    createdAt: string
    updatedAt: string
}

export interface NotificationFilterInput {
    type?: NotificationType
    status?: NotificationStatus
    companyId?: number
    unreadOnly?: boolean
}

export interface PaginatedNotifications {
    success: boolean
    message: string
    data: Notification[]
    total: number
    page: number
    limit: number
    pages: number
    unreadCount: number
}

export interface NotificationResponse {
    success: boolean
    message: string
    data?: Notification
}

export interface NotificationStatsResponse {
    totalNotifications: number
    unreadCount: number
    readCount: number
    commissionNotifications: number
    ticketNotifications: number
}

export const notificationsApi = {
    /**
     * Get paginated notifications
     */
    getNotifications: (params?: {
        page?: number
        limit?: number
        filters?: NotificationFilterInput
    }) =>
        gqlFetch<{ getNotifications: PaginatedNotifications }>({
            query: `
        query GetNotifications($page: Int, $limit: Int, $filters: NotificationFilterInput) {
          getNotifications(page: $page, limit: $limit, filters: $filters) {
            success
            message
            data {
              _id
              type
              title
              message
              status
              priority
              ticketId
              commissionTransactionId
              oldStatus
              newStatus
              actionUrl
              readAt
              createdAt
            }
            total
            unreadCount
            page
            pages
          }
        }
      `,
            variables: {
                page: params?.page,
                limit: params?.limit,
                filters: params?.filters,
            },
        }).then(res => res.getNotifications),

    /**
     * Get notification by ID
     */
    getNotification: (id: string) =>
        gqlFetch<{ getNotification: NotificationResponse }>({
            query: `
        query GetNotification($id: ID!) {
          getNotification(id: $id) {
            success
            message
            data {
              _id
              type
              title
              message
              status
              priority
              ticketId
              commissionTransactionId
              oldStatus
              newStatus
              actionUrl
              readAt
              createdAt
            }
          }
        }
      `,
            variables: { id },
        }).then(res => res.getNotification),

    /**
     * Get notification stats
     */
    getNotificationStats: () =>
        gqlFetch<{ getNotificationStats: NotificationStatsResponse }>({
            query: `
        query GetNotificationStats {
          getNotificationStats {
            totalNotifications
            unreadCount
            readCount
            commissionNotifications
            ticketNotifications
          }
        }
      `,
        }).then(res => res.getNotificationStats),

    /**
     * Mark notification as read
     */
    markAsRead: (id: string) =>
        gqlFetch<{ updateNotificationStatus: NotificationResponse }>({
            query: `
        mutation UpdateNotificationStatus($id: ID!, $input: UpdateNotificationStatusInput!) {
          updateNotificationStatus(id: $id, input: $input) {
            success
            message
            data {
              _id
              status
              readAt
            }
          }
        }
      `,
            variables: {
                id,
                input: { status: 'READ' },
            },
        }).then(res => res.updateNotificationStatus),

    /**
     * Mark all notifications as read
     */
    markAllAsRead: () =>
        gqlFetch<{ markAllNotificationsAsRead: NotificationResponse }>({
            query: `
        mutation MarkAllNotificationsAsRead {
          markAllNotificationsAsRead {
            success
            message
          }
        }
      `,
        }).then(res => res.markAllNotificationsAsRead),

    /**
     * Delete notification
     */
    deleteNotification: (id: string) =>
        gqlFetch<{ deleteNotification: NotificationResponse }>({
            query: `
        mutation DeleteNotification($id: ID!) {
          deleteNotification(id: $id) {
            success
            message
          }
        }
      `,
            variables: { id },
        }).then(res => res.deleteNotification),
}
