import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymTrainer, CreateTrainerDto } from '@/types/gymAdmin';

export const trainersApi = {
  getTrainers: async (): Promise<ApiResponse<GymTrainer[]>> => {
    const res = await apiClient.get<ApiResponse<GymTrainer[]>>('/api/v1/gymadmin/trainers');
    return res.data;
  },

  createTrainer: async (data: CreateTrainerDto): Promise<ApiResponse<GymTrainer>> => {
    const res = await apiClient.post<ApiResponse<GymTrainer>>('/api/v1/gymadmin/trainers', data);
    return res.data;
  },
};
