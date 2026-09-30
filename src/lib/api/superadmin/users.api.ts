import apiClient from '@/lib/api/axiosClient';
import {
  UserItem,
  CreateUserPayload,
  UpdateUserPayload,
  UserFilterParams,
  UserTypeCategory,
} from '@/types/user';

export type { UserItem, CreateUserPayload, UpdateUserPayload, UserFilterParams, UserTypeCategory };

import { ApiResponse } from '@/types/api';

export const usersApi = {
  getAll: async (params?: UserFilterParams) => {
    const response = await apiClient.get<ApiResponse<UserItem[]>>('/api/v1/superadmin/users', {
      params,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<UserItem>>(`/api/v1/superadmin/users/${id}`);
    return response.data;
  },

  create: async (payload: CreateUserPayload) => {
    const response = await apiClient.post<ApiResponse<UserItem>>('/api/v1/superadmin/users', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateUserPayload & { userType: UserTypeCategory }) => {
    const response = await apiClient.put<ApiResponse<UserItem>>(`/api/v1/superadmin/users/${id}`, payload);
    return response.data;
  },

  toggleStatus: async (id: string, userType: UserTypeCategory) => {
    const response = await apiClient.patch<ApiResponse<UserItem>>(`/api/v1/superadmin/users/${id}`, {
      userType,
    });
    return response.data;
  },

  delete: async (id: string, userType: UserTypeCategory) => {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/api/v1/superadmin/users/${id}`, {
      params: { userType },
    });
    return response.data;
  },
};
