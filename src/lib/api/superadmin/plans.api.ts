import apiClient from '@/lib/api/axiosClient';
import { FeatureLimits } from '@/types/plan';

export interface PlanFeaturesPayload {
  enabledFeatures: Record<string, boolean>;
  limits: FeatureLimits;
}

export interface PlanData {
  id: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeaturesPayload;
  isActive: boolean;
  activeGymsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  name: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  features?: PlanFeaturesPayload;
  isActive?: boolean;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string | null;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features?: PlanFeaturesPayload;
  isActive?: boolean;
}

export interface UpdatePlanFeaturesRequest {
  planKey: string;
  features: Record<string, boolean>;
  limits: FeatureLimits;
}

export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

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

  toggleStatus: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<PlanData>>(`/api/v1/superadmin/plans/${id}`);
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
