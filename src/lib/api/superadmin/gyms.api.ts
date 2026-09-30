import apiClient from '@/lib/api/axiosClient';
import {
  CreateGymRequest,
  UpdateGymRequest,
  GymSubscriptionData,
  PrimaryAdminData,
  GymData,
} from '@/types/gym';
import { ApiResponse } from '@/types/api';

export type { CreateGymRequest, UpdateGymRequest, GymSubscriptionData, PrimaryAdminData, GymData };

export const gymsApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<GymData[]>>('/api/v1/superadmin/gyms');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<GymData>>(`/api/v1/superadmin/gyms/${id}`);
    return response.data;
  },

  create: async (payload: CreateGymRequest) => {
    const response = await apiClient.post<ApiResponse<GymData>>('/api/v1/superadmin/gyms', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateGymRequest) => {
    const response = await apiClient.put<ApiResponse<GymData>>(`/api/v1/superadmin/gyms/${id}`, payload);
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<GymData>>(`/api/v1/superadmin/gyms/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/api/v1/superadmin/gyms/${id}`);
    return response.data;
  },
};
