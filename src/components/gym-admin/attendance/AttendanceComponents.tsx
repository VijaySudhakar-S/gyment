'use client';

import React, { useState } from 'react';
import {
  GymAttendanceRecord,
  GymMember,
  CheckInMemberDto,
} from '@/types/gymAdmin';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import {
  CheckCircle2,
  QrCode,
  Search,
  Phone,
  Calendar,
  Clock,
  Printer,
  Download,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Send,
  UserX,
  X,
  Dumbbell,
  Check,
} from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App, Table, Select, Modal } from 'antd';

export const AttendanceKpis: React.FC<{
  todayCount: number;
  currentDate?: string;
  peakTime?: string;
  absentCount?: number;
  onOpenPrintPoster?: () => void;
}> = ({
  todayCount,
  currentDate,
  peakTime = 'No check-ins yet',
  absentCount = 0,
  onOpenPrintPoster,
}) => {
  const displayDate =
    currentDate ||
    new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div className="bg-card-bg border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
          <span>Today&apos;s Attendance</span>
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-2xl sm:text-[28px] font-extrabold text-gyment-text mt-2 leading-tight">
          {todayCount}
        </div>
        <div className="text-xs text-muted mt-1">Verified check-ins today</div>
      </div>

      <div className="bg-card-bg border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
          <span>Active Date</span>
          <Calendar className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-lg sm:text-xl font-bold text-gyment-text mt-2 truncate">
          {displayDate}
        </div>
        <div className="text-xs text-muted mt-1">Current gym session</div>
      </div>

      <div className="bg-card-bg border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
          <span>Peak Check-in Window</span>
          <Clock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-base sm:text-lg font-bold text-gyment-text mt-2 truncate">
          {peakTime}
        </div>
        <div className="text-xs text-muted mt-1">Calculated from visits</div>
      </div>

      <div className="bg-card-bg border border-border rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-muted text-xs sm:text-[13px] font-semibold">
            <span>Absent (5+ Days)</span>
            <UserX className="w-4.5 h-4.5 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-[28px] font-extrabold text-rose-600 dark:text-rose-400 mt-2 leading-tight">
            {absentCount}
          </div>
        </div>
        {onOpenPrintPoster && (
          <button
            type="button"
            onClick={onOpenPrintPoster}
            className="mt-2 text-xs font-bold text-primary hover:text-primary-dark inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Entrance Poster
          </button>
        )}
      </div>
    </div>
  );
};

export const CheckInBox: React.FC<{
  members: GymMember[];
  onCheckIn: (dto: CheckInMemberDto) => Promise<void>;
  onOpenPrintPoster?: () => void;
}> = ({ members: initialMembers, onCheckIn, onOpenPrintPoster }) => {
  const { message } = App.useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberOptions, setMemberOptions] = useState<GymMember[]>(initialMembers || []);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync initial members when loaded from parent
  React.useEffect(() => {
    if (initialMembers && initialMembers.length > 0 && memberOptions.length === 0) {
      setMemberOptions(initialMembers);
    }
  }, [initialMembers, memberOptions.length]);

  // Server-side debounced search for large member databases (thousands of records)
  const handleServerSearch = (searchText: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const q = searchText?.trim();
    if (!q) {
      setMemberOptions(initialMembers || []);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await gymAdminApi.getMembers({ search: q, limit: 25 });
        if (res.status && Array.isArray(res.data)) {
          setMemberOptions(res.data);
        }
      } catch (err) {
        console.error('Failed to search members dynamically:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  const selectedMember = memberOptions.find((m) => String(m.id) === String(selectedMemberId));

  const handleSubmit = async () => {
    if (!selectedMemberId) {
      message.warning('Please select a member to mark attendance');
      return;
    }
    try {
      setIsSubmitting(true);
      await onCheckIn({
        method: 'name',
        memberId: selectedMemberId,
        memberName: selectedMember?.name,
      });
      setSelectedMemberId('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card-bg border border-border rounded-2xl p-5 sm:p-6 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-gyment-text flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Front Desk Direct Attendance
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Search any member by name, mobile number, or ID to mark attendance. Members can also scan the Entrance QR poster.
          </p>
        </div>

        {onOpenPrintPoster && (
          <button
            type="button"
            onClick={onOpenPrintPoster}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark active:scale-[0.99] transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-white" />
            Download Entrance Poster
          </button>
        )}
      </div>

      {/* Unified Single Search Control with Server-Side Debounce & Virtual List */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 min-w-70">
          <Select
            showSearch
            allowClear
            virtual
            loading={isSearching}
            filterOption={false}
            onSearch={handleServerSearch}
            placeholder="Type name, phone number, or Member ID..."
            value={selectedMemberId || undefined}
            onChange={(val) => setSelectedMemberId(val || '')}
            className="w-full text-sm h-10"
            notFoundContent={isSearching ? 'Searching...' : 'No matching member found'}
            options={memberOptions.map((m) => ({
              value: String(m.id),
              label: `${m.name} • ${m.phone} (${m.plan})`,
            }))}
          />
        </div>

        <PrimaryButton
          disabled={isSubmitting || !selectedMemberId}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Recording...' : 'Mark Present'}
        </PrimaryButton>
      </div>

      {/* Member Details Preview if selected */}
      {selectedMember && (
        <div className="mt-3.5 p-3 rounded-xl bg-bg border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-primary font-bold flex items-center justify-center text-sm uppercase">
              {selectedMember.name?.[0] || 'M'}
            </div>
            <div>
              <div className="font-bold text-gyment-text text-sm">{selectedMember.name}</div>
              <div className="text-muted text-[11px]">
                {selectedMember.phone} • Plan: {selectedMember.plan}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedMember.daysRemaining <= 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-3.5 h-3.5" /> Plan Expired
              </span>
            ) : selectedMember.daysRemaining <= 7 ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900">
                <Clock className="w-3.5 h-3.5" /> Expiring in {selectedMember.daysRemaining}d
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900">
                <Check className="w-3.5 h-3.5" /> Active Plan
              </span>
            )}

            {selectedMember.payment === 'Pending' && (
              <span className="text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900">
                Fee Pending
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AttendanceLogTable: React.FC<{
  records: GymAttendanceRecord[];
}> = ({ records }) => {
  if (!records || records.length === 0) {
    return (
      <div className="bg-card-bg border border-border rounded-2xl overflow-hidden shadow-xs">
        <GymEmptyState
          icon={CheckCircle2}
          title="No check-ins today yet"
          description="Members scanning the Entrance QR poster or checked in by reception will appear here in real-time."
        />
      </div>
    );
  }

  const columns = [
    {
      title: 'MEMBER',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text: string, row: GymAttendanceRecord) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-primary font-bold flex items-center justify-center text-xs uppercase shrink-0">
            {text?.[0] || 'M'}
          </div>
          <div>
            <div className="font-bold text-gyment-text text-[13.5px] leading-snug">{text}</div>
            {row.phone && <div className="text-[11px] text-muted">{row.phone}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'CHECK-IN TIME',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (text: string) => (
        <div className="flex items-center gap-1.5 text-muted text-[13px] font-medium">
          <Clock className="w-3.5 h-3.5 text-primary opacity-70" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'MEMBERSHIP',
      dataIndex: 'plan',
      key: 'plan',
      render: (text: string) => (
        <span className="text-gyment-text font-medium text-[13px] px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 border border-border">
          {text}
        </span>
      ),
    },
    {
      title: 'CHECK-IN METHOD',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          {method === 'qr' ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              Scanned Entrance QR
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Front Desk Portal
            </span>
          )}
        </span>
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
    <div className="bg-card-bg border border-border rounded-2xl overflow-hidden shadow-xs">
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

export const AbsenteesTable: React.FC<{
  absentees: any[];
  gymName?: string;
}> = ({ absentees, gymName = 'Our Gym' }) => {
  if (!absentees || absentees.length === 0) {
    return (
      <div className="bg-card-bg border border-border rounded-2xl overflow-hidden shadow-xs">
        <GymEmptyState
          icon={CheckCircle2}
          title="No absentees detected"
          description="Awesome! All members have checked in within the last 5 days."
        />
      </div>
    );
  }

  const columns = [
    {
      title: 'MEMBER',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, row: any) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 font-bold flex items-center justify-center text-xs uppercase shrink-0">
            {text?.[0] || 'M'}
          </div>
          <div>
            <div className="font-bold text-gyment-text text-[13.5px] leading-snug">{text}</div>
            <div className="text-[11px] text-muted">{row.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'PLAN',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <span className="text-gyment-text font-medium text-[13px]">{plan}</span>
      ),
    },
    {
      title: 'LAST SEEN',
      dataIndex: 'lastSeenDate',
      key: 'lastSeenDate',
      render: (date: string) => <span className="text-muted text-[13px]">{date}</span>,
    },
    {
      title: 'DAYS ABSENT',
      dataIndex: 'absentDays',
      key: 'absentDays',
      sorter: (a: any, b: any) => a.absentDays - b.absentDays,
      render: (days: number) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          {days} days absent
        </span>
      ),
    },
    {
      title: 'QUICK NUDGE',
      key: 'action',
      render: (_: any, row: any) => {
        const cleanPhone = String(row.phone || '').replace(/\D/g, '');
        const messageText = encodeURIComponent(
          `Hi ${row.name}, we missed you at ${gymName}! Consistency is key to your fitness goals. Hope to see you back today! 💪`
        );
        const waLink = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${messageText}`;

        return (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            WhatsApp Nudge
          </a>
        );
      },
    },
  ];

  return (
    <div className="bg-card-bg border border-border rounded-2xl overflow-hidden shadow-xs">
      <Table
        dataSource={absentees}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} absentees`,
        }}
        scroll={{ x: 600 }}
      />
    </div>
  );
};

export const PrintGymPosterModal: React.FC<{
  open: boolean;
  onClose: () => void;
  gymId?: string;
  gymName?: string;
  gymAddress?: string;
}> = ({ open, onClose, gymId, gymName = 'Gyment Fitness Center', gymAddress = 'Main Entrance Gate' }) => {
  const { message } = App.useApp();
  const [isDownloading, setIsDownloading] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const gymParam = gymId ? `?gym=${encodeURIComponent(gymId)}` : '';
  const entranceCheckinUrl = origin ? `${origin}/member/login${gymParam}` : `https://gyment.internal/member/login${gymParam}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(entranceCheckinUrl)}`;

  const handleDownloadImage = async () => {
    try {
      setIsDownloading(true);

      // Standard A4 aspect ratio 1:1.414 (1240 x 1754 px at ~150 DPI)
      const canvas = document.createElement('canvas');
      const width = 1240;
      const height = 1754;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas rendering context not available');
      }

      // 1. Clean premium background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Subtle outer margin border (decorative A4 frame)
      ctx.strokeStyle = '#2FAE68';
      ctx.lineWidth = 14;
      ctx.strokeRect(50, 50, width - 100, height - 100);

      // Inner subtle dashed guide
      ctx.strokeStyle = '#D1EAD9';
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 12]);
      ctx.strokeRect(74, 74, width - 148, height - 148);
      ctx.setLineDash([]); // Reset dash

      // 2. Header Gym Icon Badge
      const badgeY = 160;
      const badgeSize = 110;
      const badgeX = (width - badgeSize) / 2;
      ctx.fillStyle = '#2FAE68';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 28);
      ctx.fill();

      // Dumbbell white icon drawn inside badge
      ctx.fillStyle = '#FFFFFF';
      // Left weight
      ctx.beginPath();
      ctx.roundRect(badgeX + 25, badgeY + 32, 14, 46, 6);
      ctx.fill();
      // Right weight
      ctx.beginPath();
      ctx.roundRect(badgeX + badgeSize - 39, badgeY + 32, 14, 46, 6);
      ctx.fill();
      // Bar
      ctx.beginPath();
      ctx.roundRect(badgeX + 35, badgeY + 50, badgeSize - 70, 10, 4);
      ctx.fill();

      // 3. Gym Name & Address Typography
      ctx.fillStyle = '#16211B';
      ctx.font = '900 54px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gymName, width / 2, 340);

      ctx.fillStyle = '#64748B';
      ctx.font = '600 26px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText(gymAddress || 'Main Entrance Gate', width / 2, 400);

      // 4. White card container for QR code
      const cardW = 680;
      const cardH = 680;
      const cardX = (width - cardW) / 2;
      const cardY = 470;

      ctx.fillStyle = '#F4FAF6';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 36);
      ctx.fill();

      ctx.strokeStyle = '#D6EFE0';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 5. Load and draw QR Image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('Failed to load QR image'));
        qrImg.src = qrUrl;
      });

      const qrSize = 560;
      const qrX = (width - qrSize) / 2;
      const qrY = cardY + (cardH - qrSize) / 2;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 6. Call to Action badge below QR
      const pillY = 1220;
      const pillW = 340;
      const pillH = 56;
      const pillX = (width - pillW) / 2;

      ctx.fillStyle = '#E7F6ED';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 28);
      ctx.fill();

      ctx.fillStyle = '#1F8954';
      ctx.font = '800 22px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText('Instant Member Check-in', width / 2, pillY + 28);

      // 7. Instruction text
      ctx.fillStyle = '#16211B';
      ctx.font = '900 42px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText("Scan to Mark Today's Attendance", width / 2, 1340);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 24px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText('Open camera on your smartphone to scan this poster,', width / 2, 1405);
      ctx.fillText('view your digital membership card, and record your visit.', width / 2, 1445);

      // 8. Footer Brand
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 20px "Plus Jakarta Sans", -apple-system, sans-serif';
      ctx.fillText('Powered by Gyment', width / 2, 1630);

      // 9. Download trigger
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      const safeName = (gymName || 'Gyment').toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadLink.download = `${safeName}_entrance_qr_poster_A4.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      message.success('A4 Entrance QR Poster downloaded as high-resolution PNG image!');
    } catch (err: any) {
      message.error('Failed to generate poster image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={680}
      styles={{
        body: {
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        },
      }}
      closeIcon={<X className="w-5 h-5 text-gyment-text" />}
    >
      <div className="flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Download className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gyment-text leading-tight">
                Gym Entrance QR Poster
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Ready to print and stick on the entrance door.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-dark active:scale-[0.99] transition-all shadow-sm shadow-primary/25 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download as Image (A4)
              </>
            )}
          </button>
        </div>

        {/* Poster Live Preview - perfectly fitted without blank space */}
        <div className="flex justify-center p-3 sm:p-5 bg-stone-100 dark:bg-stone-900/60 rounded-2xl">
          <div
            className="w-full max-w-[460px] bg-white border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 text-center text-stone-900 shadow-xl relative"
            style={{ aspectRatio: '1 / 1.414' }}
          >
            {/* Subtle inner dashed margin */}
            <div className="absolute inset-2.5 border border-dashed border-emerald-200 rounded-xl pointer-events-none" />

            {/* Gym Icon Badge */}
            <div className="relative z-10 w-12 h-12 mx-auto rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-600/30">
              <Dumbbell className="w-6 h-6" />
            </div>

            {/* Gym Name & Location */}
            <h2 className="relative z-10 text-xl sm:text-2xl font-black tracking-tight text-stone-900 leading-tight">
              {gymName}
            </h2>
            <p className="relative z-10 text-xs text-stone-500 font-semibold mt-0.5">
              {gymAddress}
            </p>

            {/* QR Card Box */}
            <div className="relative z-10 my-4 sm:my-5 p-3.5 sm:p-4 bg-emerald-50/70 rounded-xl border border-emerald-100 inline-block shadow-inner max-w-[220px] w-full">
              <img
                src={qrUrl}
                alt="Gym Entrance Check-in QR"
                className="w-full aspect-square mx-auto object-contain"
              />
            </div>

            {/* Instructional CTA */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black mb-1.5">
                Instant Member Check-in
              </div>

              <h4 className="text-sm sm:text-base font-black text-stone-900 leading-snug">
                Scan to Mark Today&apos;s Attendance
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1 max-w-[280px] mx-auto leading-relaxed">
                Open camera on your smartphone to scan this poster, view your digital membership card, and mark yourself present.
              </p>
            </div>

            {/* Footer Watermark */}
            <div className="absolute bottom-3 left-0 right-0 text-[9px] text-stone-400 font-semibold tracking-wider">
              POWERED BY GYMENT
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
