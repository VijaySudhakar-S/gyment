import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import {
  GymProfileSettings,
  GymMembershipSettings,
  GymBrandingSettings,
  GymBranchReport,
  GymBranch,
  GymNotificationItem,
} from '@/types/gymAdmin';

export const settingsApi = {
  getProfileSettings: async (): Promise<ApiResponse<GymProfileSettings>> => {
    const res = await apiClient.get<ApiResponse<GymProfileSettings>>('/api/v1/gymadmin/settings/profile');
    return res.data;
  },

  updateProfileSettings: async (
    data: Partial<GymProfileSettings>
  ): Promise<ApiResponse<GymProfileSettings>> => {
    const res = await apiClient.put<ApiResponse<GymProfileSettings>>('/api/v1/gymadmin/settings/profile', data);
    return res.data;
  },

  getMembershipSettings: async (): Promise<ApiResponse<GymMembershipSettings>> => {
    const res = await apiClient.get<ApiResponse<GymMembershipSettings>>('/api/v1/gymadmin/settings/membership');
    return res.data;
  },

  updateMembershipSettings: async (
    data: Partial<GymMembershipSettings>
  ): Promise<ApiResponse<GymMembershipSettings>> => {
    const res = await apiClient.put<ApiResponse<GymMembershipSettings>>('/api/v1/gymadmin/settings/membership', data);
    return res.data;
  },

  getBrandingSettings: async (): Promise<ApiResponse<GymBrandingSettings>> => {
    const res = await apiClient.get<ApiResponse<GymBrandingSettings>>('/api/v1/gymadmin/settings/branding');
    return res.data;
  },

  updateBrandingSettings: async (
    data: Partial<GymBrandingSettings>
  ): Promise<ApiResponse<GymBrandingSettings>> => {
    const res = await apiClient.put<ApiResponse<GymBrandingSettings>>('/api/v1/gymadmin/settings/branding', data);
    return res.data;
  },
};

export const reportsApi = {
  getBranchReports: async (): Promise<ApiResponse<GymBranchReport[]>> => {
    const res = await apiClient.get<ApiResponse<GymBranchReport[]>>('/api/v1/gymadmin/reports/branches');
    return res.data;
  },
};

export const branchesApi = {
  getBranches: async (): Promise<ApiResponse<GymBranch[]>> => {
    const res = await apiClient.get<ApiResponse<GymBranch[]>>('/api/v1/gymadmin/branches');
    return res.data;
  },
};

export const notificationsApi = {
  getNotifications: async (): Promise<ApiResponse<GymNotificationItem[]>> => {
    const res = await apiClient.get<ApiResponse<GymNotificationItem[]>>('/api/v1/gymadmin/notifications');
    return res.data;
  },
};
