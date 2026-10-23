import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymMembershipPlan, CreateMembershipPlanDto } from '@/types/gymAdmin';

export const membershipPlansApi = {
  getMembershipPlans: async (): Promise<ApiResponse<GymMembershipPlan[]>> => {
    const res = await apiClient.get<ApiResponse<GymMembershipPlan[]>>('/api/v1/gymadmin/membership-plans');
    return res.data;
  },

  createMembershipPlan: async (
    data: CreateMembershipPlanDto
  ): Promise<ApiResponse<GymMembershipPlan>> => {
    const res = await apiClient.post<ApiResponse<GymMembershipPlan>>('/api/v1/gymadmin/membership-plans', data);
    return res.data;
  },

  updateMembershipPlan: async (
    id: string | number,
    data: Partial<CreateMembershipPlanDto>
  ): Promise<ApiResponse<GymMembershipPlan>> => {
    const res = await apiClient.put<ApiResponse<GymMembershipPlan>>(`/api/v1/gymadmin/membership-plans/${id}`, data);
    return res.data;
  },

  deleteMembershipPlan: async (id: string | number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/api/v1/gymadmin/membership-plans/${id}`);
    return res.data;
  },

  togglePlanStatus: async (
    id: string | number,
    status: 'Active' | 'Disabled'
  ): Promise<ApiResponse<GymMembershipPlan>> => {
    const res = await apiClient.patch<ApiResponse<GymMembershipPlan>>(
      `/api/v1/gymadmin/membership-plans/${id}/status`,
      { status }
    );
    return res.data;
  },
};
