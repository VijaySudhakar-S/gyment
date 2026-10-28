import React, { useState } from 'react';
import { Modal, Button, Popconfirm, Tag } from 'antd';
import { GymMember } from '@/types/gymAdmin';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { getInitials, formatRemainingDays, fmtRs } from '@/utils/gymAdminHelpers';
import {
  RefreshCw,
  Edit2,
  Trash2,
  History,
  Calendar,
  User,
  Phone,
  Mail,
  Dumbbell,
  Clock,
  CreditCard,
  Activity,
  FileText,
} from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';

interface MemberDetailModalProps {
  member: GymMember | null;
  isOpen: boolean;
  onClose: () => void;
  onRenew?: (id: string | number) => void;
  onEdit?: (member: GymMember) => void;
  onDelete?: (member: GymMember) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  onRenew,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

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
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      className="gyment-member-modal"
      title={
        <div className="flex items-center justify-between gap-3 pr-6 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm shrink-0 border border-emerald-500/20">
              {getInitials(member.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gyment-text truncate m-0">
                  {member.name}
                </h3>
                <GymStatusBadge status={member.status} />
              </div>
              <p className="text-xs text-gyment-muted truncate m-0 mt-0.5">
                {member.phone} {member.email ? `• ${member.email}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
      <div className="pt-3 space-y-4">
        {/* Sub-tabs: Overview vs Membership History */}
        <div className="flex items-center gap-1.5 border-b border-gyment-border pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-gyment-muted hover:text-gyment-text'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Plan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-gyment-muted hover:text-gyment-text'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Membership History</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gyment-bg text-gyment-muted font-bold">
              {member.membershipHistory?.length || 1}
            </span>
          </button>
        </div>

        {/* TAB 1: Profile & Current Plan */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            {/* Top 2 Cards: Current Membership + Member Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Current Active Plan Card */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> Current Plan
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rem.isOverdue
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}
                    >
                      {rem.text}
                    </span>
                  </div>

                  <div className="text-lg font-extrabold text-gyment-text">
                    {member.plan}
                  </div>

                  <div className="mt-3 space-y-1.5 text-gyment-muted">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span className="font-semibold text-gyment-text">{member.start}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expiry Date:</span>
                      <span className="font-semibold text-gyment-text">{member.expiry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="font-semibold text-gyment-text">{member.payment}</span>
                    </div>
                  </div>
                </div>

                {onRenew && (
                  <PrimaryButton
                    onClick={() => {
                      onRenew(member.id);
                      onClose();
                    }}
                    className="w-full mt-4"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Quick Renew
                  </PrimaryButton>
                )}
              </div>

              {/* Personal Details Card */}
              <div className="bg-gyment-bg/60 border border-gyment-border rounded-xl p-4 space-y-2.5">
                <span className="font-bold uppercase tracking-wider text-[11px] text-gyment-muted flex items-center gap-1 mb-2">
                  <User className="w-3.5 h-3.5" /> Member Info
                </span>

                <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
                  <span className="text-gyment-muted">Join Date</span>
                  <span className="font-semibold text-gyment-text">{member.joinDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
                  <span className="text-gyment-muted">Assigned Trainer</span>
                  <span className="font-semibold text-gyment-text">{member.trainer || 'Not Assigned'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
                  <span className="text-gyment-muted">Gender</span>
                  <span className="font-semibold text-gyment-text">{member.gender || 'Male'}</span>
                </div>
                {member.dateOfBirth && (
                  <div className="flex justify-between py-1 border-b border-dashed border-gyment-border">
                    <span className="text-gyment-muted">Date of Birth</span>
                    <span className="font-semibold text-gyment-text">{member.dateOfBirth}</span>
                  </div>
                )}
                {member.address && (
                  <div className="flex justify-between py-1">
                    <span className="text-gyment-muted">Address</span>
                    <span className="font-semibold text-gyment-text text-right max-w-[180px] truncate">{member.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-gyment-bg/60 border border-gyment-border rounded-xl p-3.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-gyment-muted flex items-center gap-1 mb-2.5">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Attendance Overview
              </span>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-white dark:bg-stone-900 border border-gyment-border rounded-lg p-2.5">
                  <div className="text-base font-extrabold text-gyment-text">{member.visits || 0}</div>
                  <div className="text-[11px] text-gyment-muted font-medium mt-0.5">Total Visits</div>
                </div>
                <div className="bg-white dark:bg-stone-900 border border-gyment-border rounded-lg p-2.5">
                  <div className="text-base font-extrabold text-gyment-text">{member.monthVisits || 0}</div>
                  <div className="text-[11px] text-gyment-muted font-medium mt-0.5">This Month</div>
                </div>
                <div className="bg-white dark:bg-stone-900 border border-gyment-border rounded-lg p-2.5">
                  <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{attendanceRate}%</div>
                  <div className="text-[11px] text-gyment-muted font-medium mt-0.5">Monthly Rate</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {member.notes && (
              <div className="p-3 bg-gyment-bg/60 rounded-xl border border-gyment-border text-gyment-muted text-xs flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-gyment-muted shrink-0 mt-0.5" />
                <span>{member.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Membership History */}
        {activeTab === 'history' && (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {member.membershipHistory && member.membershipHistory.length > 0 ? (
              member.membershipHistory.map((hist, idx) => (
                <div
                  key={hist.id || idx}
                  className={`p-3.5 rounded-xl border text-xs transition-colors flex items-center justify-between gap-3 ${
                    hist.isCurrent
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-gyment-bg/60 border-gyment-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gyment-text text-[13.5px]">
                        {hist.planName}
                      </span>
                      {hist.isCurrent && (
                        <Tag color="emerald" className="m-0 text-[10px] font-bold">
                          Current Cycle
                        </Tag>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-gyment-muted">
                      <Calendar className="w-3.5 h-3.5 text-gyment-muted" />
                      <span>
                        {hist.startDate} → {hist.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-gyment-text text-sm mb-1">
                      {fmtRs(hist.price)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        hist.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                      }`}
                    >
                      {hist.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-gyment-bg/60 rounded-xl border border-gyment-border text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-gyment-text text-[13px]">{member.plan}</div>
                  <div className="text-gyment-muted mt-1">{member.start} → {member.expiry}</div>
                </div>
                <Tag color="emerald">Current Active</Tag>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
