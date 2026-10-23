'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymAttendanceRecord,
  GymMember,
  CheckInMemberDto,
} from '@/types/gymAdmin';
import {
  AttendanceKpis,
  CheckInBox,
  AttendanceLogTable,
} from '@/components/gym-admin/attendance/AttendanceComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { App } from 'antd';

export default function GymAdminAttendancePage() {
  const { message } = App.useApp();

  const [records, setRecords] = useState<GymAttendanceRecord[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAttendanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [attRes, membersRes] = await Promise.allSettled([
        gymAdminApi.getTodayAttendance(),
        gymAdminApi.getMembers(),
      ]);

      if (attRes.status === 'fulfilled' && Array.isArray(attRes.value?.data)) {
        setRecords(attRes.value.data);
      }
      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value?.data)) {
        setMembers(membersRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleCheckIn = async (dto: CheckInMemberDto) => {
    try {
      const res = await gymAdminApi.checkInMember(dto);
      message.success('Member attendance checked in successfully');
      if (res && res.data) {
        setRecords((prev) => [res.data, ...prev]);
      } else {
        fetchAttendanceData();
      }
    } catch (err) {
      message.error('Failed to record check-in');
    }
  };

  return (
    <>
      <GymAdminTopbar
        title="Attendance"
        subtitle="Check members in and track daily visits in real time."
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-6">
        {/* KPIs */}
        <MotionFadeIn delay={0.04}>
          <AttendanceKpis todayCount={records.length} />
        </MotionFadeIn>

        {/* Check In Box */}
        <MotionFadeIn delay={0.1}>
          <CheckInBox members={members} onCheckIn={handleCheckIn} />
        </MotionFadeIn>

        {/* Today's Check-ins Table */}
        <MotionFadeIn delay={0.16}>
          <h3 className="text-sm font-bold text-gyment-text dark:text-white mb-3">
            Today&apos;s Check-ins
          </h3>
          <AttendanceLogTable records={records} />
        </MotionFadeIn>
      </main>
    </>
  );
}
