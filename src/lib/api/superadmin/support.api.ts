import apiClient from '@/lib/api/axiosClient';

import { SupportTicketItem, CreateSupportTicketPayload } from '@/types/support';
import { ApiResponse } from '@/types/api';

export type { SupportTicketItem, CreateSupportTicketPayload };

export const supportApi = {
  getAll: async (status?: string) => {
    const response = await apiClient.get<ApiResponse<SupportTicketItem[]>>('/api/v1/superadmin/support', {
      params: status && status !== 'All' ? { status } : undefined,
    });
    return response.data;
  },

  create: async (payload: CreateSupportTicketPayload) => {
    const response = await apiClient.post<ApiResponse<SupportTicketItem>>('/api/v1/superadmin/support', payload);
    return response.data;
  },

  resolve: async (id: string, resolutionNotes?: string) => {
    const response = await apiClient.patch<ApiResponse<SupportTicketItem>>(`/api/v1/superadmin/support/${id}`, {
      resolutionNotes,
    });
    return response.data;
  },
};
