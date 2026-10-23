import React from 'react';
import { Input, Select } from 'antd';
import { Search } from 'lucide-react';
import { GymMembershipPlan, GymTrainer } from '@/types/gymAdmin';

interface MembersFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPlan: string;
  onPlanChange: (plan: string) => void;
  selectedTrainer: string;
  onTrainerChange: (trainer: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  membershipPlans?: GymMembershipPlan[];
  trainers?: GymTrainer[];
}

export const MembersFilterBar: React.FC<MembersFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPlan,
  onPlanChange,
  selectedTrainer,
  onTrainerChange,
  selectedStatus,
  onStatusChange,
  membershipPlans = [],
  trainers = [],
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      {/* Search on left */}
      <div className="w-full sm:w-72">
        <Input
          prefix={<Search className="w-3.5 h-3.5 text-gyment-muted mr-1.5 shrink-0" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, phone, or email…"
          allowClear
          className="w-full h-[36px] text-xs"
        />
      </div>

      {/* All dropdown filters on right */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Status Select */}
        <Select
          value={selectedStatus || undefined}
          onChange={(val) => onStatusChange(val || '')}
          placeholder="All Statuses"
          allowClear
          className="w-full sm:w-36 h-[36px] text-xs"
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Expiring Soon', label: 'Expiring Soon' },
            { value: 'Expired', label: 'Expired' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />

        {/* Plan Select */}
        <Select
          value={selectedPlan || undefined}
          onChange={(val) => onPlanChange(val || '')}
          placeholder="All Memberships"
          allowClear
          className="w-full sm:w-40 h-[36px] text-xs"
          options={[
            { value: '', label: 'All Memberships' },
            ...membershipPlans.map((p) => ({ value: p.name, label: p.name })),
          ]}
        />

        {/* Trainer Select */}
        <Select
          value={selectedTrainer || undefined}
          onChange={(val) => onTrainerChange(val || '')}
          placeholder="All Trainers"
          allowClear
          className="w-full sm:w-36 h-[36px] text-xs"
          options={[
            { value: '', label: 'All Trainers' },
            ...trainers.map((t) => ({ value: t.name, label: t.name })),
            { value: 'Not Assigned', label: 'Not Assigned' },
          ]}
        />
      </div>
    </div>
  );
};
