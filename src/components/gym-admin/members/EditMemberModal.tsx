import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button } from 'antd';
import { GymMember, CreateMemberDto, GymMembershipPlan, GymTrainer } from '@/types/gymAdmin';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string | number, dto: Partial<CreateMemberDto> & { status?: string }) => Promise<void>;
  member: GymMember | null;
  membershipPlans?: GymMembershipPlan[];
  trainers?: GymTrainer[];
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  membershipPlans = [],
  trainers = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    dateOfBirth: '',
    joinDate: '',
    plan: '',
    trainer: 'Not Assigned',
    address: '',
    notes: '',
    status: 'Active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        gender: member.gender || 'Male',
        dateOfBirth: member.dateOfBirth || '',
        joinDate: member.joinDate || '',
        plan: member.plan !== 'No Plan' ? member.plan : '',
        trainer: member.trainer || 'Not Assigned',
        address: member.address || '',
        notes: member.notes || '',
        status: member.status || 'Active',
      });
    }
  }, [member, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !formData.name.trim() || !formData.phone.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(member.id, formData);
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
      width={620}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Edit Member</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Update member profile, membership plan, and details
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-3 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Santhosh Kumar"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Gender</label>
            <Select
              value={formData.gender}
              onChange={(val) => setFormData({ ...formData, gender: val })}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">
              Membership Plan
            </label>
            <Select
              value={formData.plan || undefined}
              onChange={(val) => setFormData({ ...formData, plan: val })}
              placeholder="Select a plan"
              options={membershipPlans.map((p) => ({
                value: p.name,
                label: `${p.name} (₹${p.price} / ${p.duration})`,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Trainer</label>
            <Select
              value={formData.trainer}
              onChange={(val) => setFormData({ ...formData, trainer: val })}
              options={[
                { value: 'Not Assigned', label: 'Not Assigned' },
                ...trainers.map((t) => ({ value: t.name, label: t.name })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Join Date</label>
            <DatePicker
              className="w-full"
              value={formData.joinDate ? dayjs(formData.joinDate) : null}
              onChange={(d) =>
                setFormData({
                  ...formData,
                  joinDate: d ? d.format('YYYY-MM-DD') : '',
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Status</label>
            <Select
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, City, Area"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Notes</label>
            <TextArea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any health goals, preferences, or medical notes"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gyment-border">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
