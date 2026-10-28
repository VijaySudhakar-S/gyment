import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymTrainer, CreateTrainerDto, UpdateTrainerDto } from '@/types/gymAdmin';

export const trainersApi = {
  getTrainers: async (): Promise<ApiResponse<GymTrainer[]>> => {
    const res = await apiClient.get<ApiResponse<GymTrainer[]>>('/api/v1/gymadmin/trainers');
    return res.data;
  },

  getTrainerById: async (id: string | number): Promise<ApiResponse<GymTrainer>> => {
    const res = await apiClient.get<ApiResponse<GymTrainer>>(`/api/v1/gymadmin/trainers/${id}`);
    return res.data;
  },

  createTrainer: async (data: CreateTrainerDto): Promise<ApiResponse<GymTrainer>> => {
    const res = await apiClient.post<ApiResponse<GymTrainer>>('/api/v1/gymadmin/trainers', data);
    return res.data;
  },

  updateTrainer: async (
    id: string | number,
    data: UpdateTrainerDto
  ): Promise<ApiResponse<GymTrainer>> => {
    const res = await apiClient.put<ApiResponse<GymTrainer>>(`/api/v1/gymadmin/trainers/${id}`, data);
    return res.data;
  },

  deleteTrainer: async (id: string | number): Promise<ApiResponse<void>> => {
    const res = await apiClient.delete<ApiResponse<void>>(`/api/v1/gymadmin/trainers/${id}`);
    return res.data;
  },
};
