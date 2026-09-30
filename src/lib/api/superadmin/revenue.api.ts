import apiClient from '@/lib/api/axiosClient';

import { MonthlyTrend, PlanRevenue, RevenueStatsData } from '@/types/revenue';
import { ApiResponse } from '@/types/api';

export type { MonthlyTrend, PlanRevenue, RevenueStatsData };

export const revenueApi = {
  getStats: async () => {
    const response = await apiClient.get<ApiResponse<RevenueStatsData>>('/api/v1/superadmin/revenue');
    return response.data;
  },
};
