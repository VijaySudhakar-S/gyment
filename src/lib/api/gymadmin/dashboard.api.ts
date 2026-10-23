import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymAdminOverviewResponse } from '@/types/gymAdmin';

export const dashboardApi = {
  getDashboard: async (branch?: string): Promise<ApiResponse<GymAdminOverviewResponse>> => {
    const res = await apiClient.get<ApiResponse<GymAdminOverviewResponse>>('/api/v1/gymadmin/dashboard', {
      params: branch && branch !== 'all' ? { branch } : {},
    });
    return res.data;
  },
};
