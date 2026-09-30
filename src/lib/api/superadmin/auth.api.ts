import apiClient from '@/lib/api/axiosClient';

import { LoginRequest, SuperAdminUser, LoginResponseData } from '@/types/auth';
import { ApiResponse } from '@/types/api';

/**
 * Authenticates SuperAdmin with email and password
 */
export async function loginSuperAdmin(credentials: LoginRequest): Promise<LoginResponseData> {
  const response = await apiClient.post<ApiResponse<LoginResponseData>>(
    '/api/v1/superadmin/auth/login',
    credentials
  );
  if (!response.data.status || !response.data.data) {
    throw new Error(response.data.message || 'Authentication failed');
  }
  return response.data.data;
}

/**
 * Fetches the currently authenticated SuperAdmin's profile
 */
export async function getSuperAdminProfile(): Promise<SuperAdminUser> {
  const response = await apiClient.get<ApiResponse<SuperAdminUser>>(
    '/api/v1/superadmin/auth/user-details'
  );
  if (!response.data.status || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch user details');
  }
  return response.data.data;
}

/**
 * Refreshes JWT tokens using the refresh token
 */
export async function refreshSuperAdminToken(refreshToken: string): Promise<{ token: string; refreshtoken: string }> {
  const response = await apiClient.post<ApiResponse<{ token: string; refreshtoken: string }>>(
    '/api/v1/superadmin/auth/refreshtoken',
    { refreshToken }
  );
  if (!response.data.status || !response.data.data) {
    throw new Error(response.data.message || 'Token refresh failed');
  }
  return response.data.data;
}

/**
 * Requests a password reset link for the given email
 */
export async function requestSuperAdminPasswordReset(email: string): Promise<string> {
  const response = await apiClient.post<ApiResponse>(
    '/api/v1/superadmin/auth/forgot-password',
    { email }
  );
  return response.data.message;
}

/**
 * Resets the password using a reset token
 */
export async function resetSuperAdminPassword(payload: {
  id: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<string> {
  const response = await apiClient.post<ApiResponse>(
    '/api/v1/superadmin/auth/reset-password',
    payload
  );
  return response.data.message;
}
