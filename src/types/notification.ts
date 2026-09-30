export interface AppNotification {
  id: number;
  t: string;
  d: string;
  ti: string;
  read: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  entityId?: string;
  entityType?: string;
}

export interface NotificationsResponseData {
  notifications: NotificationItem[];
  unreadCount: number;
}
