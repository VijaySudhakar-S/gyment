import React from 'react';
import { Drawer, Button, Popconfirm } from 'antd';
import { GymMember } from '@/types/gymAdmin';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { getInitials, formatRemainingDays } from '@/utils/gymAdminHelpers';
import { RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';

interface MemberDetailDrawerProps {
  member: GymMember | null;
  isOpen: boolean;
  onClose: () => void;
  onRenew?: (id: string | number) => void;
  onEdit?: (member: GymMember) => void;
  onDelete?: (member: GymMember) => void;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  member,
  isOpen,
  onClose,
  onRenew,
  onEdit,
  onDelete,
}) => {
  if (!member) return null;

  const hasActivePlan = member.expiry && member.expiry !== '—';
  const rem = hasActivePlan
    ? formatRemainingDays(member.daysRemaining)
    : { text: 'No Active Plan', isOverdue: false };
  const attendanceRate = Math.min(
    99,
    Math.round(((member.monthVisits || 0) / 24) * 100)
  );

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width={440}
      title={
        <div className="flex items-center justify-between gap-3 min-w-0 pr-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm shrink-0 border border-emerald-500/20">
              {getInitials(member.name)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-gyment-text truncate m-0">
                {member.name}
              </h3>
              <p className="text-xs text-gyment-muted truncate m-0">
                {member.phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <Button
                size="small"
                onClick={() => {
                  onClose();
                  onEdit(member);
                }}
                icon={<Edit2 className="w-3.5 h-3.5" />}
                className="text-xs font-semibold rounded-lg"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Popconfirm
                title="Delete Member"
                description={`Delete ${member.name}? All attendance and subscription records will be removed.`}
                onConfirm={() => {
                  onClose();
                  onDelete(member);
                }}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  size="small"
                  danger
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold rounded-lg"
                />
              </Popconfirm>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-sm">
        {/* Overview */}
        <div>
          <h4 className="font-bold uppercase tracking-wider text-xs text-gyment-muted mb-2">
            Overview
          </h4>
          <div className="bg-gyment-bg/60 rounded-xl p-3.5 border border-gyment-border space-y-2.5">
            <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Email</span>
              <span className="font-semibold text-gyment-text">
                {member.email || '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Join Date</span>
              <span className="font-semibold text-gyment-text">
                {member.joinDate}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gyment-muted">Status</span>
              <GymStatusBadge status={member.status} />
            </div>
          </div>
        </div>

        {/* Current Membership */}
        <div>
          <h4 className="font-bold uppercase tracking-wider text-xs text-gyment-muted mb-2">
            Current Membership
          </h4>
          <div className="bg-gyment-bg/60 rounded-xl p-3.5 border border-gyment-border space-y-2.5">
            <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Plan</span>
              <span className="font-bold text-gyment-text">
                {member.plan}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Start Date</span>
              <span className="font-semibold text-gyment-text">
                {member.start}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
              <span className="text-gyment-muted">Expiry Date</span>
              <span className="font-semibold text-gyment-text">
                {member.expiry}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gyment-muted">Remaining</span>
              <span
                className={`font-bold ${rem.isOverdue
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                  }`}
              >
                {rem.text}
              </span>
            </div>

            {onRenew && (
              <PrimaryButton
                onClick={() => {
                  onRenew(member.id);
                  onClose();
                }}
                className="w-full mt-2.5"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Renew Membership
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Attendance Stats */}
        <div>
          <h4 className="font-bold uppercase tracking-wider text-xs text-gyment-muted mb-2">
            Attendance
          </h4>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-gyment-bg/60 border border-gyment-border rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-gyment-text">
                {member.visits || 0}
              </div>
              <div className="text-xs text-gyment-muted font-semibold mt-0.5">
                Total Visits
              </div>
            </div>
            <div className="bg-gyment-bg/60 border border-gyment-border rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-gyment-text">
                {member.monthVisits || 0}
              </div>
              <div className="text-xs text-gyment-muted font-semibold mt-0.5">
                This Month
              </div>
            </div>
            <div className="bg-gyment-bg/60 border border-gyment-border rounded-xl p-3 text-center">
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {attendanceRate}%
              </div>
              <div className="text-xs text-gyment-muted font-semibold mt-0.5">
                Rate
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h4 className="font-bold uppercase tracking-wider text-xs text-gyment-muted mb-2">
            Notes
          </h4>
          <div className="p-3.5 bg-gyment-bg/60 rounded-xl border border-gyment-border text-gyment-muted italic text-xs">
            {member.notes || 'No specific notes recorded for this member.'}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
