import axios from 'axios';
import { ApiResponse } from '@/types/api';
import { MemberLoginResponseData } from '@/types/auth';

const MEMBER_TOKEN_KEY = 'gyment_member_token';
const MEMBER_DATA_KEY = 'gyment_member_data';

export const memberApi = {
  login: async (phone: string): Promise<ApiResponse<MemberLoginResponseData>> => {
    const res = await axios.post<ApiResponse<MemberLoginResponseData>>('/api/v1/member/auth/login', { phone });
    if (res.data.status && res.data.data?.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(MEMBER_TOKEN_KEY, res.data.data.token);
        localStorage.setItem(MEMBER_DATA_KEY, JSON.stringify(res.data.data.member));
      }
    }
    return res.data;
  },

  getProfile: async (): Promise<ApiResponse<any>> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(MEMBER_TOKEN_KEY) : null;
    const res = await axios.get<ApiResponse<any>>('/api/v1/member/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  checkIn: async (qrToken?: string): Promise<ApiResponse<any>> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(MEMBER_TOKEN_KEY) : null;
    const res = await axios.post<ApiResponse<any>>(
      '/api/v1/member/attendance/checkin',
      { qrToken },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MEMBER_TOKEN_KEY);
      localStorage.removeItem(MEMBER_DATA_KEY);
    }
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(MEMBER_TOKEN_KEY);
    }
    return null;
  },

  getCachedMember: () => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(MEMBER_DATA_KEY);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
    }
    return null;
  },
};
