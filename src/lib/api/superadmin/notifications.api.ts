import apiClient from '@/lib/api/axiosClient';

import { NotificationItem, NotificationsResponseData } from '@/types/notification';
import { ApiResponse } from '@/types/api';

export type { NotificationItem, NotificationsResponseData };

export const notificationsApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<NotificationsResponseData>>('/api/v1/superadmin/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/superadmin/notifications', { id });
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post<ApiResponse<void>>('/api/v1/superadmin/notifications', { all: true });
    return response.data;
  },
};
