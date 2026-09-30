export interface NotificationDTO {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  entityId?: string;
  entityType?: string;
}
