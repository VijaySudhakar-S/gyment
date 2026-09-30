'use client';

import React, { useState, useEffect } from 'react';
import { Modal, App } from 'antd';
import { plansApi } from '@/lib/api/superadmin/plans.api';
import { PlanFormModalProps } from '@/types/modals';

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  planToEdit,
}) => {
  const { message } = App.useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<string>('');
  const [yearlyPrice, setYearlyPrice] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
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
        setErrors({});
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [planToEdit, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Plan name is required';
    }
    if (!monthlyPrice) {
      newErrors.monthlyPrice = 'Monthly price is required';
    } else if (Number(monthlyPrice) <= 0) {
      newErrors.monthlyPrice = 'Monthly price must be greater than 0';
    }
    if (!yearlyPrice) {
      newErrors.yearlyPrice = 'Yearly price is required';
    } else if (Number(yearlyPrice) <= 0) {
      newErrors.yearlyPrice = 'Yearly price must be greater than 0';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      setIsSubmitting(true);
      if (planToEdit) {
        await plansApi.update(planToEdit.id, {
          name: name.trim(),
          description: description.trim() || null,
          monthlyPrice: Number(monthlyPrice),
          yearlyPrice: Number(yearlyPrice),
          isActive,
        });
        message.success('Plan updated successfully');
      } else {
        await plansApi.create({
          name: name.trim(),
          description: description.trim() || null,
          monthlyPrice: Number(monthlyPrice),
          yearlyPrice: Number(yearlyPrice),
          isActive,
        });
        message.success('Plan created successfully');
      }
      onSuccess?.();
      onClose(true); // signal parent that save happened
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const response = err?.response as Record<string, unknown>;
      const responseData = response?.data as Record<string, unknown>;
      const msg = (responseData?.message as string) || (err?.message as string) || 'Failed to save plan';
      message.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthly = Number(monthlyPrice);
  const yearly = Number(yearlyPrice);
  const annualIfMonthly = monthly * 12;
  const yearlySavingPct =
    monthly > 0 && yearly > 0 && yearly < annualIfMonthly
      ? Math.round(((annualIfMonthly - yearly) / annualIfMonthly) * 100)
      : null;
  const hasNoAnnualDiscount = monthly > 0 && yearly > 0 && yearly >= annualIfMonthly;

  return (
    <Modal
      open={open}
      onCancel={() => onClose()}
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
      <form onSubmit={handleSubmit} noValidate className="pt-4 space-y-4">
        {/* Plan Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-gyment-text">Plan Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
            placeholder="e.g. Enterprise, Pro Plus"
            className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors ${
              errors.name ? 'border-red-400 bg-red-50/40' : 'border-gyment-border'
            }`}
          />
          {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
        </div>

        {/* Description */}
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

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gyment-text">Monthly Price (₹) *</label>
            <input
              type="text"
              inputMode="numeric"
              value={monthlyPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+(\.\d{0,2})?$/.test(val)) {
                  setMonthlyPrice(val);
                  setErrors(prev => ({ ...prev, monthlyPrice: '', yearlyPrice: '' }));
                }
              }}
              placeholder="e.g. 999"
              className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors ${
                errors.monthlyPrice ? 'border-red-400 bg-red-50/40' : 'border-gyment-border'
              }`}
            />
            {errors.monthlyPrice && <p className="text-[11px] text-red-500">{errors.monthlyPrice}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gyment-text">Yearly Price (₹) *</label>
            <input
              type="text"
              inputMode="numeric"
              value={yearlyPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+(\.\d{0,2})?$/.test(val)) {
                  setYearlyPrice(val);
                  setErrors(prev => ({ ...prev, yearlyPrice: '' }));
                }
              }}
              placeholder="e.g. 9999"
              className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors ${
                errors.yearlyPrice ? 'border-red-400 bg-red-50/40' : 'border-gyment-border'
              }`}
            />
            {errors.yearlyPrice && <p className="text-[11px] text-red-500">{errors.yearlyPrice}</p>}
          </div>
        </div>

        {/* Yearly savings hint */}
        {yearlySavingPct !== null && (
          <div className="flex items-center gap-1.5 text-[11.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span>✓</span>
            <span>Yearly plan saves <b>{yearlySavingPct}%</b> vs. paying monthly</span>
          </div>
        )}
        
        {/* No discount warning */}
        {hasNoAnnualDiscount && (
          <div className="flex items-center gap-1.5 text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <span>⚠️</span>
            <span>Yearly price is higher than or equal to 12× monthly (no annual discount).</span>
          </div>
        )}

        {/* Active toggle */}
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

        {/* Footer */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-gyment-border">
          <button
            type="button"
            onClick={() => onClose()}
            disabled={isSubmitting}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-lg text-sm font-semibold text-gyment-text transition-colors disabled:opacity-50"
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
