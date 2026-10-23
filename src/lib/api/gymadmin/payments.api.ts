import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymPaymentRecord, RecordPaymentDto } from '@/types/gymAdmin';

export const paymentsApi = {
  getPayments: async (params?: {
    search?: string;
    limit?: number;
  }): Promise<ApiResponse<GymPaymentRecord[]>> => {
    const res = await apiClient.get<ApiResponse<GymPaymentRecord[]>>('/api/v1/gymadmin/payments', {
      params,
    });
    return res.data;
  },

  recordPayment: async (data: RecordPaymentDto): Promise<ApiResponse<GymPaymentRecord>> => {
    const res = await apiClient.post<ApiResponse<GymPaymentRecord>>('/api/v1/gymadmin/payments', data);
    return res.data;
  },
};
