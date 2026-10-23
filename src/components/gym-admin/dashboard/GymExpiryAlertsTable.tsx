import React from 'react';
import { GymMember } from '@/types/gymAdmin';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { formatRemainingDays, getInitials } from '@/utils/gymAdminHelpers';
import { CheckCircle2 } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Table } from 'antd';

interface GymExpiryAlertsTableProps {
  members: GymMember[];
  onViewMember?: (member: GymMember) => void;
  onRenewMember?: (id: string | number) => void;
}

export const GymExpiryAlertsTable: React.FC<GymExpiryAlertsTableProps> = ({
  members,
  onViewMember,
  onRenewMember,
}) => {
  if (!members || members.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <GymEmptyState
          icon={CheckCircle2}
          title="No Expiry Alerts"
          description="All member subscriptions are in good standing right now."
        />
      </div>
    );
  }

  const columns = [
    {
      title: 'MEMBER',
      key: 'member',
      render: (_: any, m: GymMember) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-200 dark:border-emerald-800/60">
            {getInitials(m.name)}
          </div>
          <div>
            <div className="font-bold text-gyment-text text-[13.5px]">
              {m.name}
            </div>
            <div className="text-xs text-muted">
              {m.phone}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'PLAN',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <span className="font-semibold text-gyment-text text-[13.5px]">{plan}</span>
      ),
    },
    {
      title: 'EXPIRY',
      key: 'expiry',
      render: (_: any, m: GymMember) => {
        const rem = formatRemainingDays(m.daysRemaining);
        return (
          <span
            className={`font-semibold text-[13px] ${
              rem.isOverdue
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {rem.text}
          </span>
        );
      },
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status: any) => <GymStatusBadge status={status} />,
    },
    {
      title: 'ACTION',
      key: 'action',
      align: 'right' as const,
      render: (_: any, m: GymMember) => (
        <div className="flex items-center justify-end gap-1.5">
          {onViewMember && (
            <button
              type="button"
              onClick={() => onViewMember(m)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-stone-100 dark:hover:bg-stone-800 text-gyment-text transition-colors cursor-pointer"
            >
              View
            </button>
          )}
          {onRenewMember && (
            <PrimaryButton
              size="sm"
              onClick={() => onRenewMember(m.id)}
            >
              Renew
            </PrimaryButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
      <Table
        dataSource={members}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          showTotal: (total) => `${total} alerts`,
        }}
        scroll={{ x: 650 }}
      />
    </div>
  );
};
