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
  AbsenteesTable,
  PrintGymPosterModal,
} from '@/components/gym-admin/attendance/AttendanceComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { App } from 'antd';
import { CheckCircle2, UserX, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';

export default function GymAdminAttendancePage() {
  const { message } = App.useApp();

  const [records, setRecords] = useState<GymAttendanceRecord[]>([]);
  const [members, setMembers] = useState<GymMember[]>([]);
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [gymProfile, setGymProfile] = useState<any>(null);
  const [peakTime, setPeakTime] = useState<string>('No check-ins yet');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'today' | 'absentees'>('today');
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  const fetchAttendanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [attRes, membersRes, absenteesRes, profileRes] = await Promise.allSettled([
        gymAdminApi.getTodayAttendance(),
        gymAdminApi.getMembers({ limit: 20 }),
        gymAdminApi.getAbsentees(5),
        gymAdminApi.getProfileSettings(),
      ]);

      if (attRes.status === 'fulfilled') {
        const val: any = attRes.value;
        if (Array.isArray(val?.data)) {
          setRecords(val.data);
        }
        if (val?.meta?.peakTime) {
          setPeakTime(val.meta.peakTime);
        }
      }
      if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value?.data)) {
        setMembers(membersRes.value.data);
      }
      if (absenteesRes.status === 'fulfilled' && Array.isArray(absenteesRes.value?.data)) {
        setAbsentees(absenteesRes.value.data);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
        setGymProfile(profileRes.value.data);
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
        // Also remove member from absentees if present
        if (res.data.memberId) {
          setAbsentees((prev) => prev.filter((a) => String(a.id) !== String(res.data.memberId)));
        }
      } else {
        fetchAttendanceData();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to record check-in';
      message.error(errorMsg);
    }
  };

  return (
    <>
      <GymAdminTopbar
        title="Attendance & Check-in"
        subtitle="Manage daily check-ins: front desk search entry or member Entrance QR Poster scans."
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-6">
        {/* KPIs Banner */}
        <MotionFadeIn delay={0.04}>
          <AttendanceKpis
            todayCount={records.length}
            peakTime={peakTime}
            absentCount={absentees.length}
            onOpenPrintPoster={() => setIsPosterModalOpen(true)}
          />
        </MotionFadeIn>

        {/* Front Desk Search & Check In Box */}
        <MotionFadeIn delay={0.12}>
          <CheckInBox
            members={members}
            onCheckIn={handleCheckIn}
            onOpenPrintPoster={() => setIsPosterModalOpen(true)}
          />
        </MotionFadeIn>

        {/* Tab Switching: Today's Check-ins vs Absentee Recovery */}
        <MotionFadeIn delay={0.16}>
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('today')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'today'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-card-bg text-muted hover:text-gyment-text border border-border'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Today&apos;s Check-ins ({records.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('absentees')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'absentees'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-card-bg text-muted hover:text-gyment-text border border-border'
                }`}
              >
                <UserX className="w-4 h-4" />
                Absent 5+ Days ({absentees.length})
              </button>
            </div>

            <span className="text-xs text-muted hidden sm:inline-block">
              {activeTab === 'today' ? 'Live check-in stream' : 'Retention & WhatsApp follow-ups'}
            </span>
          </div>

          {activeTab === 'today' ? (
            <AttendanceLogTable records={records} />
          ) : (
            <AbsenteesTable absentees={absentees} gymName={gymProfile?.gymName} />
          )}
        </MotionFadeIn>
      </main>

      {/* Printable Gym Poster Modal */}
      <PrintGymPosterModal
        open={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        gymId={gymProfile?.gymId}
        gymName={gymProfile?.gymName || 'Gyment Fitness Center'}
        gymAddress={gymProfile?.address || 'Main Entrance Door'}
      />
    </>
  );
}
