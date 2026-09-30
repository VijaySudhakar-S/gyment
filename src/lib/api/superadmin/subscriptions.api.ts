import apiClient from '@/lib/api/axiosClient';

import {
  SubscriptionItem,
  SubscriptionKPIs,
  SubscriptionsResponseData,
  ChangePlanPayload,
  ExtendSubscriptionPayload,
  UpdateStatusPayload,
} from '@/types/subscription';
import { ApiResponse } from '@/types/api';

export type { SubscriptionItem, SubscriptionKPIs, SubscriptionsResponseData, ChangePlanPayload, ExtendSubscriptionPayload, UpdateStatusPayload };

export const subscriptionsApi = {
  getAll: async (params?: { search?: string; planId?: string; status?: string }) => {
    const response = await apiClient.get<ApiResponse<SubscriptionsResponseData>>('/api/v1/superadmin/subscriptions', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<SubscriptionItem>>(`/api/v1/superadmin/subscriptions/${id}`);
    return response.data;
  },

  changePlan: async (payload: ChangePlanPayload) => {
    const response = await apiClient.post<ApiResponse<SubscriptionItem>>('/api/v1/superadmin/subscriptions', payload);
    return response.data;
  },

  extend: async (id: string, payload?: ExtendSubscriptionPayload) => {
    const response = await apiClient.patch<ApiResponse<SubscriptionItem>>(`/api/v1/superadmin/subscriptions/${id}`, {
      action: 'EXTEND',
      ...payload,
    });
    return response.data;
  },

  updateStatus: async (id: string, payload: UpdateStatusPayload) => {
    const response = await apiClient.patch<ApiResponse<SubscriptionItem>>(`/api/v1/superadmin/subscriptions/${id}`, payload);
    return response.data;
  },
};
