import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from '@/lib/auth/tokenStorage';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach bearer token from centralized tokenStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Transparent 401 token refresh queue & retry
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<{ status?: boolean; message?: string; errors?: string[] }>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refreshtoken') ||
      originalRequest.url?.includes('/auth/forgot-password') ||
      originalRequest.url?.includes('/auth/reset-password');

    // Handle token expiration with transparent background refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearSession();
        isRefreshing = false;
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      try {
        const response = await axios.post(
          `${env.apiUrl}/api/v1/superadmin/auth/refreshtoken`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newTokens = response.data?.data;
        if (!newTokens?.token) {
          throw new Error('Invalid token refresh response');
        }

        tokenStorage.setToken(newTokens.token);
        if (newTokens.refreshtoken) {
          tokenStorage.setRefreshToken(newTokens.refreshtoken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.token}`;
        }

        processQueue(null, newTokens.token);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(new Error('Session expired. Please log in again.'), null);
        tokenStorage.clearSession();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    const errorData = error.response?.data;
    const errorMessage =
      errorData?.message ||
      (errorData?.errors && errorData.errors.join(', ')) ||
      error.message ||
      'An unexpected network error occurred.';

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
