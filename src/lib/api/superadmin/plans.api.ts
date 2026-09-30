import apiClient from '@/lib/api/axiosClient';

import {
  PlanFeaturesPayload,
  PlanData,
  CreatePlanRequest,
  UpdatePlanRequest,
  UpdatePlanFeaturesRequest,
} from '@/types/plan';
import { ApiResponse } from '@/types/api';

export type { PlanFeaturesPayload, PlanData, CreatePlanRequest, UpdatePlanRequest, UpdatePlanFeaturesRequest };

export const plansApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<PlanData[]>>('/api/v1/superadmin/plans');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PlanData>>(`/api/v1/superadmin/plans/${id}`);
    return response.data;
  },

  create: async (payload: CreatePlanRequest) => {
    const response = await apiClient.post<ApiResponse<PlanData>>('/api/v1/superadmin/plans', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdatePlanRequest) => {
    const response = await apiClient.put<ApiResponse<PlanData>>(`/api/v1/superadmin/plans/${id}`, payload);
    return response.data;
  },

  toggleStatus: async (id: string, isActive: boolean) => {
    const response = await apiClient.patch<ApiResponse<PlanData>>(`/api/v1/superadmin/plans/${id}`, { isActive });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/api/v1/superadmin/plans/${id}`);
    return response.data;
  },

  updateFeatures: async (payload: UpdatePlanFeaturesRequest) => {
    const response = await apiClient.put<ApiResponse<PlanData>>('/api/v1/superadmin/plans/features', payload);
    return response.data;
  },
};
