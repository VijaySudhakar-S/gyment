import apiClient from '@/lib/api/axiosClient';

import {
  GymReportMetrics,
  SubscriptionReportMetrics,
  UserReportMetrics,
  ReportMetricsData,
  ExportResponseData,
} from '@/types/report';
import { ApiResponse } from '@/types/api';

export type { GymReportMetrics, SubscriptionReportMetrics, UserReportMetrics, ReportMetricsData, ExportResponseData };

export const reportsApi = {
  getMetrics: async () => {
    const response = await apiClient.get<ApiResponse<ReportMetricsData>>('/api/v1/superadmin/reports');
    return response.data;
  },

  exportData: async (type: 'gyms' | 'subscriptions' | 'revenue' | 'users') => {
    const response = await apiClient.post<ApiResponse<ExportResponseData>>('/api/v1/superadmin/reports', { type });
    return response.data;
  },
};
