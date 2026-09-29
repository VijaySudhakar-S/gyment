import apiClient from '@/lib/api/axiosClient';

export interface CreateGymRequest {
  name: string;
  location: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  planId: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  status?: 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED';
  password?: string;
}

export interface UpdateGymRequest {
  name?: string;
  location?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  status?: 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED';
}

export interface GymSubscriptionData {
  id: string;
  planId: string;
  planName: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  price: number;
  startDate: string;
  renewalDate: string;
}

export interface PrimaryAdminData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface GymData {
  id: string;
  code: string;
  schemaName: string;
  name: string;
  location: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  status: 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED';
  activeSubscription?: GymSubscriptionData | null;
  primaryAdmin?: PrimaryAdminData | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export const gymsApi = {
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<GymData[]>>('/api/v1/superadmin/gyms');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<GymData>>(`/api/v1/superadmin/gyms/${id}`);
    return response.data;
  },

  create: async (payload: CreateGymRequest) => {
    const response = await apiClient.post<ApiResponse<GymData>>('/api/v1/superadmin/gyms', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateGymRequest) => {
    const response = await apiClient.put<ApiResponse<GymData>>(`/api/v1/superadmin/gyms/${id}`, payload);
    return response.data;
  },

  toggleStatus: async (id: string) => {
    const response = await apiClient.patch<ApiResponse<GymData>>(`/api/v1/superadmin/gyms/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/api/v1/superadmin/gyms/${id}`);
    return response.data;
  },
};
