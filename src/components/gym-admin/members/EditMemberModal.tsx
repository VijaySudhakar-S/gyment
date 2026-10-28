import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button } from 'antd';
import { GymMember, CreateMemberDto, GymTrainer, GymMembershipPlan } from '@/types/gymAdmin';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { Check } from 'lucide-react';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string | number, dto: Partial<CreateMemberDto> & { status?: string }) => Promise<void>;
  member: GymMember | null;
  trainers?: GymTrainer[];
  membershipPlans?: GymMembershipPlan[];
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  trainers = [],
}) => {
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    dateOfBirth: '',
    joinDate: '',
    trainer: 'Not Assigned',
    address: '',
    notes: '',
    status: 'Active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member && isOpen) {
      setErrorMsg('');
      setFormData({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        gender: member.gender || 'Male',
        dateOfBirth: member.dateOfBirth || '',
        joinDate: member.joinDate || '',
        trainer: member.trainer || 'Not Assigned',
        address: member.address || '',
        notes: member.notes || '',
        status: member.status === 'Inactive' ? 'Inactive' : 'Active',
      });
    }
  }, [member, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!member) return;
    if (!formData.name.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Phone Number is required');
      return;
    }
    if (!formData.joinDate) {
      setErrorMsg('Join Date is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(member.id, formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedAge = formData.dateOfBirth
    ? (() => {
        const dob = dayjs(formData.dateOfBirth);
        return dob.isValid() ? dayjs().diff(dob, 'year') : null;
      })()
    : null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={540}
      centered
      className="clean-member-modal"
      title={
        <div className="pt-1">
          <h3 className="text-base font-bold text-gyment-text m-0">Edit Member Details</h3>
          <p className="text-xs text-gyment-muted mt-0.5">
            Update personal information, contact info, and assigned trainer
          </p>
        </div>
      }
    >
      {errorMsg && (
        <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
          {errorMsg}
        </div>
      )}

      {member && (
        <form onSubmit={handleSubmit} className="pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Santhosh Kumar"
                className="h-9 text-sm"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-9 text-sm"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@email.com"
                className="h-9 text-sm"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">Gender</label>
              <Select
                value={formData.gender}
                onChange={(val) => setFormData({ ...formData, gender: val })}
                className="h-9 w-full"
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gyment-text">Date of Birth</label>
                {calculatedAge !== null && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {calculatedAge} yrs
                  </span>
                )}
              </div>
              <DatePicker
                className="w-full h-9"
                placeholder="Select date"
                value={formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null}
                onChange={(d) =>
                  setFormData({
                    ...formData,
                    dateOfBirth: d ? d.format('YYYY-MM-DD') : '',
                  })
                }
              />
            </div>

            {/* Join Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">
                Join Date <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                className="w-full h-9"
                value={formData.joinDate ? dayjs(formData.joinDate) : null}
                onChange={(d) =>
                  setFormData({
                    ...formData,
                    joinDate: d ? d.format('YYYY-MM-DD') : '',
                  })
                }
              />
            </div>

            {/* Member Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">Member Status</label>
              <Select
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                className="h-9 w-full"
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
              />
            </div>

            {/* Assigned Trainer */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">Assigned Trainer</label>
              <Select
                value={formData.trainer}
                onChange={(val) => setFormData({ ...formData, trainer: val })}
                className="h-9 w-full"
                options={[
                  { value: 'Not Assigned', label: 'Not Assigned' },
                  ...trainers.map((t) => ({ value: t.name, label: t.name })),
                ]}
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street, City, Area"
                className="h-9 text-sm"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-gyment-text">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any health goals, preferences, or medical notes"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gyment-border-subtle mt-1">
            <Button onClick={onClose} disabled={isSubmitting} className="h-9 text-sm px-4">
              Cancel
            </Button>
            <PrimaryButton type="submit" disabled={isSubmitting} className="h-9 text-sm px-4">
              <span className="flex items-center gap-1.5">
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                <Check className="w-3.5 h-3.5" />
              </span>
            </PrimaryButton>
          </div>
        </form>
      )}
    </Modal>
  );
};
