import { apiClient } from '@/lib/api/axiosClient';
import { GymLoginRequest, GymLoginResponseData } from '@/types/auth';

export const loginGymUser = async (
  credentials: GymLoginRequest
): Promise<GymLoginResponseData> => {
  const response = await apiClient.post<{
    status: boolean;
    message: string;
    data: GymLoginResponseData;
  }>('/api/v1/gym/auth/login', credentials);

  if (!response.data.status || !response.data.data) {
    throw new Error(response.data.message || 'Login failed');
  }

  return response.data.data;
};
