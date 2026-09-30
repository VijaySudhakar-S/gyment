'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, message, Select, Button } from 'antd';
import { plansApi, PlanData } from '@/lib/api/superadmin/plans.api';
import { gymsApi, GymData } from '@/lib/api/superadmin/gyms.api';
import { subscriptionsApi } from '@/lib/api/superadmin/subscriptions.api';

import { ChangePlanModalProps } from '@/types/modals';

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ open, onClose, gymId, onSuccess }) => {
  const [gym, setGym] = useState<GymData | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!gymId) return;
    try {
      const [gymRes, plansRes] = await Promise.all([
        gymsApi.getById(String(gymId)),
        plansApi.getAll(),
      ]);

      if (gymRes.status && gymRes.data) {
        setGym(gymRes.data);
        if (gymRes.data.activeSubscription?.planId) {
          setSelectedPlanId(gymRes.data.activeSubscription.planId);
          setBillingCycle(gymRes.data.activeSubscription.billingCycle || 'MONTHLY');
        }
      }

      if (plansRes.status && Array.isArray(plansRes.data)) {
        const activePlans = plansRes.data.filter(p => p.isActive);
        setPlans(activePlans);
        if (!gymRes.data?.activeSubscription?.planId && activePlans.length > 0) {
          setSelectedPlanId(activePlans[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load plan change data:', error);
    }
  }, [gymId]);

  useEffect(() => {
    if (open && gymId) {
      loadData();
    }
  }, [open, gymId, loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId || !selectedPlanId) return;

    try {
      setIsSubmitting(true);
      const res = await subscriptionsApi.changePlan({
        gymId: String(gymId),
        planId: selectedPlanId,
        billingCycle,
      });

      if (res.status) {
        message.success('Subscription plan updated successfully');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to change plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={460}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Change Subscription Plan</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Update SaaS subscription tier for {gym?.name || 'this gym'}
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-4 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">Select Plan *</label>
          <Select
            value={selectedPlanId || undefined}
            onChange={(val) => setSelectedPlanId(val)}
            className="w-full text-sm"
            placeholder="Select a plan"
            options={plans.map(p => ({
              value: p.id,
              label: `${p.name} (₹${p.monthlyPrice}/mo • ₹${p.yearlyPrice}/yr)`,
            }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">Billing Cycle</label>
          <Select
            value={billingCycle}
            onChange={(val) => setBillingCycle(val)}
            className="w-full text-sm"
            options={[
              { value: 'MONTHLY', label: 'Monthly Billing' },
              { value: 'YEARLY', label: 'Yearly Billing (Discounted)' },
            ]}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gyment-border">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={!selectedPlanId}
          >
            Confirm Change
          </Button>
        </div>
      </form>
    </Modal>
  );
};
