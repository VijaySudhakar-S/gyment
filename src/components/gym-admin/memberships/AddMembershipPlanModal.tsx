import React, { useState, useEffect } from 'react';
import { Modal, Input, InputNumber, Select, Button, Tag } from 'antd';
import { CreateMembershipPlanDto, GymMembershipPlan } from '@/types/gymAdmin';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { Check, Plus, X, Sparkles } from 'lucide-react';

const { TextArea } = Input;

interface AddMembershipPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateMembershipPlanDto) => Promise<void>;
  planToEdit?: GymMembershipPlan | null;
}

const DURATION_PRESETS = [
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
];

export const AddMembershipPlanModal: React.FC<AddMembershipPlanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  planToEdit,
}) => {
  const [formData, setFormData] = useState<CreateMembershipPlanDto>({
    name: '',
    price: 1500,
    durationDays: 30,
    status: 'Active',
    desc: '',
    features: [],
  });

  const [featureInput, setFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setFeatureInput('');
      if (planToEdit) {
        setFormData({
          name: planToEdit.name,
          price: planToEdit.price,
          durationDays: planToEdit.durationDays || 30,
          status: planToEdit.status,
          desc: planToEdit.desc || '',
          features: Array.isArray(planToEdit.features) ? [...planToEdit.features] : [],
        });
      } else {
        setFormData({
          name: '',
          price: 1500,
          durationDays: 30,
          status: 'Active',
          desc: '',
          features: ['Full Gym Access', 'Locker Facility'],
        });
      }
    }
  }, [isOpen, planToEdit]);

  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (formData.features && formData.features.includes(trimmed)) {
      setFeatureInput('');
      return;
    }
    setFormData({
      ...formData,
      features: [...(formData.features || []), trimmed],
    });
    setFeatureInput('');
  };

  const handleRemoveFeature = (featToRemove: string) => {
    setFormData({
      ...formData,
      features: (formData.features || []).filter((f) => f !== featToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Plan name is required');
      return;
    }
    if (formData.price < 0) {
      setErrorMsg('Price cannot be negative');
      return;
    }
    if (formData.durationDays <= 0) {
      setErrorMsg('Duration must be at least 1 day');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthlyEquivalent =
    formData.durationDays > 0
      ? Math.round((formData.price / formData.durationDays) * 30)
      : formData.price;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      className="clean-member-modal"
      title={
        <div className="pt-0.5">
          <h2 className="text-base font-bold text-gyment-text m-0">
            {planToEdit ? 'Edit Membership Plan' : 'Create Membership Plan'}
          </h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            {planToEdit
              ? 'Update package duration, pricing, and member benefits'
              : 'Configure a new subscription package for gym members'}
          </p>
        </div>
      }
    >
      {errorMsg && (
        <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="pt-2 space-y-3.5">
        {/* Plan Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gyment-text">
            Plan Name <span className="text-rose-500">*</span>
          </label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Monthly Standard, Quarterly Pro, Annual VIP"
            className="h-9 text-sm"
          />
        </div>

        {/* Pricing & Duration Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gyment-text">
                Plan Price <span className="text-rose-500">*</span>
              </label>
              {formData.durationDays > 30 && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {fmtRs(monthlyEquivalent)}/mo
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gyment-muted pointer-events-none z-10">
                ₹
              </span>
              <InputNumber
                required
                min={0}
                className="w-full h-9 pl-4"
                value={formData.price}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => Number((val || '').replace(/₹\s?|(,*)/g, '')) || 0}
                onChange={(val) => setFormData({ ...formData, price: Number(val) || 0 })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gyment-text">
              Duration (Days) <span className="text-rose-500">*</span>
            </label>
            <InputNumber
              required
              min={1}
              className="w-full h-9"
              value={formData.durationDays}
              onChange={(val) =>
                setFormData({ ...formData, durationDays: Number(val) || 1 })
              }
            />
          </div>
        </div>

        {/* Duration Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {DURATION_PRESETS.map((preset) => {
            const isSelected = formData.durationDays === preset.days;
            return (
              <button
                key={preset.days}
                type="button"
                onClick={() => setFormData({ ...formData, durationDays: preset.days })}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'bg-transparent border-gyment-border-subtle hover:border-gyment-border text-gyment-muted hover:text-gyment-text'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gyment-text">Status</label>
          <Select
            value={formData.status}
            onChange={(val) =>
              setFormData({
                ...formData,
                status: val as 'Active' | 'Disabled',
              })
            }
            className="h-9 w-full"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Disabled', label: 'Disabled' },
            ]}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gyment-text">
            Description <span className="text-gyment-muted font-normal text-[11px]">(Optional)</span>
          </label>
          <TextArea
            rows={2}
            value={formData.desc}
            onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            placeholder="Brief package summary or promotional note"
            className="text-xs leading-relaxed"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2.5">
          <Button onClick={onClose} disabled={isSubmitting} className="h-9 text-sm px-4">
            Cancel
          </Button>
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            className="h-9 text-sm px-4"
          >
            <span className="flex items-center gap-1.5">
              <span>{isSubmitting ? (planToEdit ? 'Saving...' : 'Creating...') : (planToEdit ? 'Save Changes' : 'Save Plan')}</span>
              <Check className="w-3.5 h-3.5" />
            </span>
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
