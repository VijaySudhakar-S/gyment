import React, { useState } from 'react';
import { GymTrainer, CreateTrainerDto } from '@/types/gymAdmin';
import { useGymAdmin } from '@/context/GymAdminContext';
import { LockedCard } from '@/components/gym-admin/shared/LockedCard';
import { GymEmptyState } from '@/components/gym-admin/shared/GymEmptyState';
import { getInitials } from '@/utils/gymAdminHelpers';
import { Dumbbell, Plus, X } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Modal, Input, Button, Table } from 'antd';
import type { TableColumnsType } from 'antd';

export const TrainersView: React.FC<{
  trainers: GymTrainer[];
  isLoading?: boolean;
  onAddTrainerClick: () => void;
}> = ({ trainers, isLoading, onAddTrainerClick }) => {
  const { hasFeature } = useGymAdmin();
  const canManageTrainers = hasFeature('Trainer Management');
  const canAssignTrainers = hasFeature('Trainer–Member Assignment');

  if (!canManageTrainers) {
    return (
      <div className="py-4">
        <LockedCard
          title="Trainer Management"
          planRequired="Growth"
          description="Add dedicated trainers, track specializations, and assign them directly to members when you upgrade to Growth."
        />
      </div>
    );
  }

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

  const columns: TableColumnsType<GymTrainer> = [
    {
      title: 'TRAINER',
      dataIndex: 'name',
      key: 'name',
      render: (_, t) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/20">
            {getInitials(t.name)}
          </div>
          <span className="font-bold text-gyment-text text-[13.5px]">
            {t.name}
          </span>
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
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
      render: (val) => (
        <span className="text-gyment-muted text-[13px]">{val || '—'}</span>
      ),
    },
    {
      title: 'SPECIALIZATION',
      dataIndex: 'specialization',
      key: 'specialization',
      render: (val) => (
        <span className="font-semibold text-gyment-text text-[13px]">{val || 'General Fitness'}</span>
      ),
    },
    {
      title: 'ASSIGNED',
      dataIndex: 'assignedMembersCount',
      key: 'assignedMembersCount',
      render: (val) => (
        <span className="font-bold text-gyment-text text-[13px]">{val || 0} members</span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (val) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {val}
        </span>
      ),
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right',
      render: () => (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="small" className="text-xs font-semibold rounded-lg">
            Edit
          </Button>
          {canAssignTrainers && (
            <Button size="small" type="primary" ghost className="text-xs font-semibold rounded-lg">
              Assign
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
        <Table<GymTrainer>
          columns={columns}
          dataSource={trainers}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} trainers`,
          }}
          locale={{
            emptyText: (
              <div className="py-6">
                <GymEmptyState
                  icon={Dumbbell}
                  title="No trainers added yet"
                  description="Add your first fitness coach or trainer to begin member assignments."
                  action={{ label: 'Add Trainer', onClick: onAddTrainerClick }}
                />
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export const AddTrainerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTrainerDto) => Promise<void>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateTrainerDto>({
    name: '',
    specialization: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

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
          <h2 className="text-base font-bold text-gyment-text m-0">Add Trainer</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Create a new trainer profile for your gym
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-3 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Trainer Name <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Deepika R."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Specialization
          </label>
          <Input
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            placeholder="e.g. Strength & Conditioning, CrossFit, Yoga"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="trainer@gym.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">
            Phone <span className="text-rose-500">*</span>
          </label>
          <Input
            required
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
            {isSubmitting ? 'Saving...' : 'Add Trainer'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
