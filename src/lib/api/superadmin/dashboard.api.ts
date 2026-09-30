import apiClient from '@/lib/api/axiosClient';


import {
  ActivityTimelineItem,
  PlanDistributionItem,
  DashboardOverviewData,
} from '@/types/dashboard';
import { ApiResponse } from '@/types/api';

export type { ActivityTimelineItem, PlanDistributionItem, DashboardOverviewData };

export const dashboardApi = {
  getOverview: async () => {
    const response = await apiClient.get<ApiResponse<DashboardOverviewData>>('/api/v1/superadmin/dashboard');
    return response.data;
  },
};
