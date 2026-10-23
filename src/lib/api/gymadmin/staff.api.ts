import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymStaff, CreateStaffDto } from '@/types/gymAdmin';

export const staffApi = {
  getStaff: async (): Promise<ApiResponse<GymStaff[]>> => {
    const res = await apiClient.get<ApiResponse<GymStaff[]>>('/api/v1/gymadmin/staff');
    return res.data;
  },

  createStaff: async (data: CreateStaffDto): Promise<ApiResponse<GymStaff>> => {
    const res = await apiClient.post<ApiResponse<GymStaff>>('/api/v1/gymadmin/staff', data);
    return res.data;
  },

  toggleStaffStatus: async (
    id: string | number,
    status: 'Active' | 'Inactive'
  ): Promise<ApiResponse<GymStaff>> => {
    const res = await apiClient.patch<ApiResponse<GymStaff>>(`/api/v1/gymadmin/staff/${id}/status`, { status });
    return res.data;
  },
};
