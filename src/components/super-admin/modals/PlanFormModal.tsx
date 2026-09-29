'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { PlanData } from '@/lib/api/superadmin/plans.api';

interface PlanFormModalProps {
  open: boolean;
  onClose: () => void;
  planToEdit?: PlanData | null;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  open,
  onClose,
  planToEdit,
}) => {
  const { createPlan, updatePlan } = useSuperAdmin();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<string>('');
  const [yearlyPrice, setYearlyPrice] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name || '');
      setDescription(planToEdit.description || '');
      setMonthlyPrice(String(planToEdit.monthlyPrice ?? ''));
      setYearlyPrice(String(planToEdit.yearlyPrice ?? ''));
      setIsActive(planToEdit.isActive ?? true);
    } else {
      setName('');
      setDescription('');
      setMonthlyPrice('');
      setYearlyPrice('');
      setIsActive(true);
    }
  }, [planToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !monthlyPrice || !yearlyPrice) return;

    try {
      setIsSubmitting(true);
      if (planToEdit) {
        await updatePlan(planToEdit.id, {
          name: name.trim(),
          description: description.trim() || null,
          monthlyPrice: Number(monthlyPrice),
          yearlyPrice: Number(yearlyPrice),
          isActive,
        });
      } else {
        await createPlan({
          name: name.trim(),
          description: description.trim() || null,
          monthlyPrice: Number(monthlyPrice),
          yearlyPrice: Number(yearlyPrice),
          isActive,
        });
      }
      onClose();
    } catch {
      // Error handled by notification in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={540}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">
            {planToEdit ? `Edit Plan: ${planToEdit.name}` : 'Create New Plan'}
          </h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            {planToEdit
              ? 'Update plan details, pricing, and visibility status.'
              : 'Add a new SaaS subscription tier with custom pricing.'}
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-4 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-gyment-text">Plan Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Enterprise, Pro Plus"
            className="w-full text-sm border border-gyment-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-gyment-text">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short overview of who this plan is tailored for..."
            className="w-full text-sm border border-gyment-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gyment-text">Monthly Price (₹) *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={monthlyPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) setMonthlyPrice(val);
              }}
              placeholder="e.g. 999"
              className="w-full text-sm border border-gyment-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gyment-text">Yearly Price (₹) *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={yearlyPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) setYearlyPrice(val);
              }}
              placeholder="e.g. 9999"
              className="w-full text-sm border border-gyment-border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="plan-active-checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary"
          />
          <label htmlFor="plan-active-checkbox" className="text-sm text-gyment-text select-none cursor-pointer">
            Plan is active and available for subscriptions
          </label>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gyment-border">
          <button
            type="button"
            onClick={onClose}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-lg text-sm font-semibold text-gyment-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : planToEdit ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
