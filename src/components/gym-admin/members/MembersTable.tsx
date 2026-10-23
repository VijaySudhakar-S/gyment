import React from 'react';
import { Table, Button, Popconfirm } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { GymMember } from '@/types/gymAdmin';
import { GymStatusBadge } from '@/components/gym-admin/shared/GymStatusBadge';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { getInitials } from '@/utils/gymAdminHelpers';
import { Users, Eye, Edit2, Trash2 } from 'lucide-react';

interface MembersTableProps {
  members: GymMember[];
  isLoading?: boolean;
  onViewMember: (member: GymMember) => void;
  onEditMember?: (member: GymMember) => void;
  onDeleteMember?: (member: GymMember) => void;
  onAddMember?: () => void;
  pagination?: TablePaginationConfig | false;
  onChange?: (pagination: TablePaginationConfig) => void;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  members,
  isLoading,
  onViewMember,
  onEditMember,
  onDeleteMember,
  onAddMember,
  pagination = {
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} members`,
  },
  onChange,
}) => {
  const columns: TableColumnsType<GymMember> = [
    {
      title: 'MEMBER',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-500/20">
            {getInitials(record.name)}
          </div>
          <div>
            <div className="font-bold text-gyment-text text-[13.5px]">
              {record.name}
            </div>
            <div className="text-xs text-gyment-muted">
              Joined {record.joinDate}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'PHONE',
      dataIndex: 'phone',
      key: 'phone',
      render: (val) => (
        <span className="text-gyment-text font-medium text-[13px]">{val || '—'}</span>
      ),
    },
    {
      title: 'MEMBERSHIP',
      dataIndex: 'plan',
      key: 'plan',
      render: (val) => (
        <span className="font-semibold text-gyment-text text-[13px]">{val}</span>
      ),
    },
    {
      title: 'START DATE',
      dataIndex: 'start',
      key: 'start',
      render: (val) => (
        <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
      ),
    },
    {
      title: 'EXPIRY',
      dataIndex: 'expiry',
      key: 'expiry',
      render: (val) => (
        <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <GymStatusBadge status={val} type="membership" />,
    },
    {
      title: 'PAYMENT',
      dataIndex: 'payment',
      key: 'payment',
      render: (val) => <GymStatusBadge status={val} type="payment" />,
    },
    {
      title: 'TRAINER',
      dataIndex: 'trainer',
      key: 'trainer',
      render: (val) => (
        <span className="text-gyment-text font-medium text-[13px]">
          {val || 'Not Assigned'}
        </span>
      ),
    },
    {
      title: 'ACTION',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="small"
            onClick={() => onViewMember(record)}
            icon={<Eye className="w-3.5 h-3.5" />}
            className="font-semibold text-xs rounded-lg"
          >
            View
          </Button>
          {onEditMember && (
            <Button
              size="small"
              onClick={() => onEditMember(record)}
              icon={<Edit2 className="w-3.5 h-3.5" />}
              className="font-semibold text-xs rounded-lg"
            >
              Edit
            </Button>
          )}
          {onDeleteMember && (
            <Popconfirm
              title="Delete Member"
              description={`Are you sure you want to delete ${record.name}? This will remove attendance and subscription history.`}
              onConfirm={() => onDeleteMember(record)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                danger
                icon={<Trash2 className="w-3.5 h-3.5" />}
                className="font-semibold text-xs rounded-lg"
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
      <Table<GymMember>
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={isLoading}
        pagination={pagination}
        onChange={(p) => onChange?.(p)}
        locale={{
          emptyText: (
            <div className="py-6">
              <GymEmptyState
                icon={Users}
                title="No members found"
                description="Try adjusting your search criteria or add your first gym member."
                action={onAddMember ? { label: 'Add Member', onClick: onAddMember } : undefined}
              />
            </div>
          ),
        }}
      />
    </div>
  );
};
