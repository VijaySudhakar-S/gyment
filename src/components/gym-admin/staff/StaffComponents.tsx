import React, { useState } from 'react';
import { GymStaff, CreateStaffDto, StaffRole } from '@/types/gymAdmin';
import { useGymAdmin } from '@/context/GymAdminContext';
import { GYMENT_PLANS, getInitials } from '@/utils/gymAdminHelpers';
import { LockedInline } from '@/components/gym-admin/shared/LockedCard';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { Briefcase, Plus, X } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App, Modal, Input, Select, Button, Table } from 'antd';
import type { TableColumnsType } from 'antd';

export const StaffView: React.FC<{
  staff: GymStaff[];
  isLoading?: boolean;
  onAddStaffClick: () => void;
  onToggleStatus?: (id: string | number, currentStatus: string) => void;
}> = ({ staff, isLoading, onAddStaffClick, onToggleStatus }) => {
  const { planTier } = useGymAdmin();
  const planInfo = GYMENT_PLANS[planTier];
  const limit = planInfo.staffLimit;
  const isLimitReached = limit !== Infinity && staff.length >= limit;

  if (isLoading) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-stone-200 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-stone-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLimitReached && (
        <LockedInline
          title="Staff limit reached"
          planRequired={planTier === 'starter' ? 'Growth' : 'Pro'}
          description={`Your ${planInfo.name} plan supports up to ${limit} staff account${limit > 1 ? 's' : ''
            }.`}
        />
      )}

      {/* AntD Staff Table */}
      <div className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
        <Table<GymStaff>
          columns={[
            {
              title: 'STAFF NAME',
              dataIndex: 'name',
              key: 'name',
              render: (_, s) => (
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/20">
                    {getInitials(s.name)}
                  </div>
                  <span className="font-bold text-gyment-text text-[13.5px]">
                    {s.name}
                  </span>
                </div>
              ),
            },
            {
              title: 'EMAIL',
              dataIndex: 'email',
              key: 'email',
              render: (val) => (
                <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
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
              title: 'ROLE',
              dataIndex: 'role',
              key: 'role',
              render: (val) => (
                <span className="font-semibold text-gyment-text text-[13px]">{val}</span>
              ),
            },
            {
              title: 'STATUS',
              dataIndex: 'status',
              key: 'status',
              render: (val) => (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${val === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20'
                    }`}
                >
                  {val}
                </span>
              ),
            },
            {
              title: 'LAST ACTIVE',
              dataIndex: 'lastActive',
              key: 'lastActive',
              render: (val) => (
                <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
              ),
            },
            {
              title: 'ACTIONS',
              key: 'actions',
              align: 'right',
              render: (_, s) => (
                <div className="flex items-center justify-end gap-1.5">
                  <Button size="small" className="text-xs font-semibold rounded-lg">
                    Edit
                  </Button>
                  {onToggleStatus && (
                    <Button
                      size="small"
                      onClick={() => onToggleStatus(s.id, s.status)}
                      className="text-xs font-semibold rounded-lg"
                    >
                      {s.status === 'Active' ? 'Disable' : 'Enable'}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          dataSource={staff}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} staff`,
          }}
          locale={{
            emptyText: (
              <div className="py-6">
                <GymEmptyState
                  icon={Briefcase}
                  title="No staff accounts added yet"
                  description="Add desk attendants, front-desk administrators, or managers."
                  action={
                    isLimitReached
                      ? undefined
                      : { label: 'Add Staff', onClick: onAddStaffClick }
                  }
                />
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export const AddStaffModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateStaffDto) => Promise<void>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateStaffDto>({
    name: '',
    role: 'Front Desk',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const roles: StaffRole[] = ['Front Desk', 'Manager', 'Housekeeping'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Add Staff</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Create a staff account for your gym
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-3 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Staff Name <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Kavya M."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">Role</label>
          <Select
            value={formData.role}
            onChange={(val) => setFormData({ ...formData, role: val as StaffRole })}
            className="w-full"
            options={roles.map((r) => ({ value: r, label: r }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Email <span className="text-rose-500">*</span>
          </label>
          <Input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="staff@gym.in"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">Phone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gyment-border">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Add Staff'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
