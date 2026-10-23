import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymMember, CreateMemberDto } from '@/types/gymAdmin';

export const membersApi = {
  getMembers: async (params?: {
    status?: string;
    search?: string;
    trainer?: string;
    plan?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<GymMember[]>> => {
    const res = await apiClient.get<ApiResponse<GymMember[]>>('/api/v1/gymadmin/members', {
      params,
    });
    return res.data;
  },

  getMemberById: async (id: string | number): Promise<ApiResponse<GymMember>> => {
    const res = await apiClient.get<ApiResponse<GymMember>>(`/api/v1/gymadmin/members/${id}`);
    return res.data;
  },

  createMember: async (data: CreateMemberDto): Promise<ApiResponse<GymMember>> => {
    const res = await apiClient.post<ApiResponse<GymMember>>('/api/v1/gymadmin/members', data);
    return res.data;
  },

  updateMember: async (
    id: string | number,
    data: Partial<CreateMemberDto> & { status?: string }
  ): Promise<ApiResponse<GymMember>> => {
    const res = await apiClient.put<ApiResponse<GymMember>>(`/api/v1/gymadmin/members/${id}`, data);
    return res.data;
  },

  deleteMember: async (id: string | number): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/api/v1/gymadmin/members/${id}`);
    return res.data;
  },

  quickRenewMember: async (id: string | number): Promise<ApiResponse<GymMember>> => {
    const res = await apiClient.post<ApiResponse<GymMember>>(`/api/v1/gymadmin/members/${id}/renew`);
    return res.data;
  },
};
