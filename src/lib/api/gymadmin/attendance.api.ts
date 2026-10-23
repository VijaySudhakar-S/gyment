import { apiClient } from '@/lib/api/axiosClient';
import { ApiResponse } from '@/types/api';
import { GymAttendanceRecord, CheckInMemberDto } from '@/types/gymAdmin';

export const attendanceApi = {
  getTodayAttendance: async (): Promise<ApiResponse<GymAttendanceRecord[]>> => {
    const res = await apiClient.get<ApiResponse<GymAttendanceRecord[]>>('/api/v1/gymadmin/attendance/today');
    return res.data;
  },

  checkInMember: async (data: CheckInMemberDto): Promise<ApiResponse<GymAttendanceRecord>> => {
    const res = await apiClient.post<ApiResponse<GymAttendanceRecord>>('/api/v1/gymadmin/attendance/checkin', data);
    return res.data;
  },
};
