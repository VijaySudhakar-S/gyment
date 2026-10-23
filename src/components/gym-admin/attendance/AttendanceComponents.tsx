import React, { useState } from 'react';
import {
  GymAttendanceRecord,
  AttendanceCheckinMethod,
  GymMember,
  CheckInMemberDto,
} from '@/types/gymAdmin';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { useGymAdmin } from '@/context/GymAdminContext';
import { CheckCircle2, QrCode, Search, Phone, Calendar, Clock } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App, Table } from 'antd';

export const AttendanceKpis: React.FC<{
  todayCount: number;
  currentDate?: string;
  peakTime?: string;
}> = ({ todayCount, currentDate, peakTime = '6:00–8:00 AM' }) => {
  const displayDate =
    currentDate ||
    new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
          <span>Today&apos;s Attendance</span>
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-2xl sm:text-[28px] font-extrabold text-gyment-text mt-2 leading-tight">
          {todayCount}
        </div>
        <div className="text-xs text-muted mt-1">
          Visits recorded today
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
          <span>Current Date</span>
          <Calendar className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-gyment-text mt-2 truncate">
          {displayDate}
        </div>
        <div className="text-xs text-muted mt-1">
          Active session
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
          <span>Peak Check-in Time</span>
          <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-gyment-text mt-2 truncate">
          {peakTime}
        </div>
        <div className="text-xs text-muted mt-1">
          Highest footfall
        </div>
      </div>
    </div>
  );
};

export const CheckInBox: React.FC<{
  members: GymMember[];
  onCheckIn: (dto: CheckInMemberDto) => Promise<void>;
}> = ({ members, onCheckIn }) => {
  const { hasFeature, openCompareModal } = useGymAdmin();
  const { message } = App.useApp();
  const [method, setMethod] = useState<AttendanceCheckinMethod>('name');
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [phoneOrId, setPhoneOrId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canUseAdvancedMethods = hasFeature('Multiple Attendance Methods');

  const handleMethodSelect = (m: AttendanceCheckinMethod) => {
    if (m !== 'name' && !canUseAdvancedMethods) {
      message.info('Phone & QR check-in are available in the Growth plan');
      openCompareModal();
      return;
    }
    setMethod(m);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (method === 'name') {
        const name = selectedMemberName || members[0]?.name;
        if (!name) {
          message.warning('Please select a member');
          return;
        }
        const found = members.find((m) => m.name === name);
        await onCheckIn({
          method: 'name',
          memberName: name,
          memberId: found?.id,
        });
      } else if (method === 'phone') {
        if (!phoneOrId.trim()) {
          message.warning('Please enter phone or member ID');
          return;
        }
        await onCheckIn({
          method: 'phone',
          phoneOrId,
        });
        setPhoneOrId('');
      } else {
        await onCheckIn({
          method: 'qr',
          qrToken: 'SCAN_' + Date.now(),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 mb-6 shadow-xs">
      <h3 className="text-base font-bold text-gyment-text mb-3.5">
        Check In a Member
      </h3>

      {/* Method tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleMethodSelect('name')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer border ${
            method === 'name'
              ? 'border-primary bg-primary-light text-primary-dark dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-border bg-white text-stone-600'
          }`}
        >
          <Search className="w-4 h-4" />
          Search by Name
        </button>

        <button
          type="button"
          onClick={() => handleMethodSelect('phone')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer border ${
            method === 'phone'
              ? 'border-primary bg-primary-light text-primary-dark dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-border bg-white text-stone-600'
          }`}
        >
          <Phone className="w-4 h-4" />
          Phone / Member ID
          {!canUseAdvancedMethods && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold ml-1">
              🔒 Growth
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleMethodSelect('qr')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer border ${
            method === 'qr'
              ? 'border-primary bg-primary-light text-primary-dark dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-border bg-white text-stone-600'
          }`}
        >
          <QrCode className="w-4 h-4" />
          QR Code
          {!canUseAdvancedMethods && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold ml-1">
              🔒 Growth
            </span>
          )}
        </button>
      </div>

      {/* Input row */}
      <div className="flex flex-wrap items-center gap-3">
        {method === 'name' && (
          <select
            value={selectedMemberName}
            onChange={(e) => setSelectedMemberName(e.target.value)}
            className="border border-border bg-white rounded-lg px-3.5 py-2 text-[13.5px] text-gyment-text outline-none min-w-[260px] cursor-pointer"
          >
            <option value="">Select a member...</option>
            {members.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.plan})
              </option>
            ))}
          </select>
        )}

        {method === 'phone' && (
          <input
            type="text"
            value={phoneOrId}
            onChange={(e) => setPhoneOrId(e.target.value)}
            placeholder="Enter phone or member ID"
            className="border border-border bg-white rounded-lg px-3.5 py-2 text-[13.5px] text-gyment-text outline-none min-w-[260px]"
          />
        )}

        {method === 'qr' ? (
          <div className="w-full border-1.5 border-dashed border-border rounded-xl p-6 text-center text-xs text-muted">
            <QrCode className="w-8 h-8 mx-auto mb-2 text-primary opacity-80" />
            <p className="font-semibold text-gyment-text text-sm mb-1">
              Scan Member QR Code
            </p>
            <p className="text-xs mb-3 text-muted">
              Position the member digital pass inside the scanner view
            </p>
            <PrimaryButton
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              Simulate QR Scan
            </PrimaryButton>
          </div>
        ) : (
          <PrimaryButton
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Checking In...' : 'Check In'}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
};

export const AttendanceLogTable: React.FC<{
  records: GymAttendanceRecord[];
}> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
        <GymEmptyState
          icon={CheckCircle2}
          title="No check-ins today yet"
          description="Members checking in today will appear here in real-time."
        />
      </div>
    );
  }

  const columns = [
    {
      title: 'MEMBER',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text: string) => (
        <span className="font-bold text-gyment-text text-[13.5px]">{text}</span>
      ),
    },
    {
      title: 'CHECK-IN TIME',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (text: string) => (
        <span className="text-muted text-[13px]">{text}</span>
      ),
    },
    {
      title: 'MEMBERSHIP',
      dataIndex: 'plan',
      key: 'plan',
      render: (text: string) => (
        <span className="text-gyment-text font-medium text-[13px]">{text}</span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {status}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-xs">
      <Table
        dataSource={records}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} check-ins`,
        }}
        scroll={{ x: 600 }}
      />
    </div>
  );
};
