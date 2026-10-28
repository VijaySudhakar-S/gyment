import React from 'react';
import { Drawer, Button, Popconfirm } from 'antd';
import { GymMember } from '@/types/gymAdmin';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { getInitials, formatRemainingDays, fmtRs } from '@/utils/gymAdminHelpers';
import { RefreshCw, Edit2, Trash2, History, Calendar, CheckCircle2 } from 'lucide-react';
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
      size={440}
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

        {/* Membership History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold uppercase tracking-wider text-xs text-gyment-muted flex items-center gap-1.5 m-0">
              <History className="w-3.5 h-3.5 text-emerald-500" />
              Membership History
            </h4>
            <span className="text-[11px] font-semibold text-gyment-muted">
              {member.membershipHistory?.length || 1} record{member.membershipHistory && member.membershipHistory.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-2.5">
            {member.membershipHistory && member.membershipHistory.length > 0 ? (
              member.membershipHistory.map((hist, idx) => (
                <div
                  key={hist.id || idx}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    hist.isCurrent
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-gyment-bg/60 border-gyment-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gyment-text text-[13px]">
                        {hist.planName}
                      </span>
                      {hist.isCurrent && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        hist.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                      }`}
                    >
                      {hist.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gyment-muted pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gyment-muted" />
                      <span>
                        {hist.startDate} → {hist.endDate}
                      </span>
                    </div>
                    <span className="font-semibold text-gyment-text">
                      {fmtRs(hist.price)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gyment-bg/60 rounded-xl border border-gyment-border text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gyment-text text-[13px]">{member.plan}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-gyment-muted">
                  <span>{member.start} → {member.expiry}</span>
                  <span className="font-semibold text-gyment-text">Enrolled</span>
                </div>
              </div>
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
