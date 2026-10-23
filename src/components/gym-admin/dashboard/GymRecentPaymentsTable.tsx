import React from 'react';
import { GymPaymentRecord } from '@/types/gymAdmin';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { ReceiptIndianRupee } from 'lucide-react';
import { Table } from 'antd';

interface GymRecentPaymentsTableProps {
  payments: GymPaymentRecord[];
}

export const GymRecentPaymentsTable: React.FC<GymRecentPaymentsTableProps> = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <GymEmptyState
          icon={ReceiptIndianRupee}
          title="No Recent Payments"
          description="Payments will appear here when collected."
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
      title: 'PLAN',
      dataIndex: 'plan',
      key: 'plan',
      render: (text: string) => (
        <span className="text-muted font-medium text-[13px]">{text}</span>
      ),
    },
    {
      title: 'AMOUNT',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
          {fmtRs(amount)}
        </span>
      ),
    },
    {
      title: 'METHOD',
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => (
        <span className="inline-block px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 border border-border font-semibold text-gyment-text text-xs">
          {method}
        </span>
      ),
    },
    {
      title: 'DATE',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <span className="text-muted text-[13px]">{date}</span>
      ),
    },
  ];

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-xs">
      <Table
        dataSource={payments}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          showTotal: (total) => `${total} payments`,
        }}
        scroll={{ x: 500 }}
      />
    </div>
  );
};
