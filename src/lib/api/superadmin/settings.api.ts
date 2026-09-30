import apiClient from '@/lib/api/axiosClient';

import {
  AdminProfile,
  PlatformSettingsData,
  UpdatePlatformSettingsPayload,
  UpdateAdminProfilePayload,
} from '@/types/settings';
import { ApiResponse } from '@/types/api';

export type { AdminProfile, PlatformSettingsData, UpdatePlatformSettingsPayload, UpdateAdminProfilePayload };

export const settingsApi = {
  get: async (adminId?: string) => {
    const response = await apiClient.get<ApiResponse<PlatformSettingsData>>('/api/v1/superadmin/settings', {
      params: adminId ? { adminId } : undefined,
    });
    return response.data;
  },

  updatePlatform: async (payload: UpdatePlatformSettingsPayload) => {
    const response = await apiClient.put<ApiResponse<PlatformSettingsData>>('/api/v1/superadmin/settings', {
      section: 'platform',
      payload,
    });
    return response.data;
  },

  updateProfile: async (adminId: string, payload: UpdateAdminProfilePayload) => {
    const response = await apiClient.put<ApiResponse<AdminProfile>>('/api/v1/superadmin/settings', {
      section: 'profile',
      adminId,
      payload,
    });
    return response.data;
  },
};
