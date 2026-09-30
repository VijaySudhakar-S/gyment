'use client';

import React, { useState, useEffect } from 'react';
import { Modal, App, Input, Select, Button } from 'antd';
import { gymsApi } from '@/lib/api/superadmin/gyms.api';
import { plansApi, PlanData } from '@/lib/api/superadmin/plans.api';

import { AddGymModalProps } from '@/types/modals';

export const AddGymModal: React.FC<AddGymModalProps> = ({ open, onClose, onSuccess }) => {
  const { message } = App.useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [status, setStatus] = useState<'ACTIVE' | 'TRIAL'>('ACTIVE');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [planList, setPlanList] = useState<PlanData[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      if (open && planList.length === 0) {
        setIsLoadingPlans(true);
        try {
          const res = await plansApi.getAll();
          const plans = Array.isArray(res?.data) ? res.data : [];
          const activePlans = plans.filter((p: PlanData) => p.isActive);
          setPlanList(activePlans);
          if (activePlans.length > 0) {
            setSelectedPlanId(activePlans[0].id);
          }
        } catch (error) {
          message.error('Failed to load plans');
        } finally {
          setIsLoadingPlans(false);
        }
      }
    };
    fetchPlans();
  }, [open, planList.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminName.trim() || !adminEmail.trim() || !adminPhone.trim() || !selectedPlanId) {
      message.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;

    if (!emailRegex.test(adminEmail.trim())) {
      message.error('Please enter a valid email address');
      return;
    }

    if (!phoneRegex.test(adminPhone.trim())) {
      message.error('Please enter a valid phone number (min 10 digits)');
      return;
    }

    try {
      setIsSubmitting(true);
      await gymsApi.create({
        name: name.trim(),
        location: location.trim() || 'Main Branch',
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        adminPhone: adminPhone.trim(),
        planId: selectedPlanId,
        billingCycle,
        status,
        password: password.trim() || undefined,
      });

      message.success('Gym created and provisioned successfully');
      
      // Reset form
      setName('');
      setLocation('');
      setAdminName('');
      setAdminEmail('');
      setAdminPhone('');
      setPassword('');
      setBillingCycle('MONTHLY');
      setStatus('ACTIVE');
      onClose();
      
      if (onSuccess) {
        await onSuccess();
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || 'Failed to create gym');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Add Gym</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Register a new gym on the GYMENT platform with an Admin user and subscription plan
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-4 space-y-4">
        {/* Gym Information */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gyment-muted uppercase tracking-wider m-0">
            Gym Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Gym Name *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flex Arena Gym"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Location / Branch</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jubilee Hills, Hyderabad"
              />
            </div>
          </div>
        </div>

        {/* Primary Admin Information */}
        <div className="space-y-3 pt-2 border-t border-gyment-border">
          <h3 className="text-xs font-bold text-gyment-muted uppercase tracking-wider m-0">
            Gym Owner / Admin Credentials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Admin Name *</label>
              <Input
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Admin Email *</label>
              <Input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@flexarena.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Admin Phone Number *</label>
              <Input
                type="tel"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">
                Initial Admin Password <span className="font-normal text-gyment-muted">(leave blank for default)</span>
              </label>
              <Input.Password
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Default: GymentAdmin@123"
              />
            </div>
          </div>
        </div>

        {/* Plan & Subscription */}
        <div className="space-y-3 pt-2 border-t border-gyment-border">
          <h3 className="text-xs font-bold text-gyment-muted uppercase tracking-wider m-0">
            Subscription Plan Selection
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-gyment-text">Select Plan *</label>
              <Select
                loading={isLoadingPlans}
                value={selectedPlanId || undefined}
                onChange={(val) => setSelectedPlanId(val)}
                className="w-full text-xs"
                options={planList.map((p) => ({
                  value: p.id,
                  label: `${p.name} (₹${p.monthlyPrice}/mo)`,
                }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Billing Cycle</label>
              <Select
                value={billingCycle}
                onChange={(val) => setBillingCycle(val)}
                className="w-full text-xs"
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'YEARLY', label: 'Yearly' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Initial Status</label>
              <Select
                value={status}
                onChange={(val) => setStatus(val)}
                className="w-full text-xs"
                options={[
                  { value: 'ACTIVE', label: 'Active Subscription' },
                  { value: 'TRIAL', label: 'Trial Period' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gyment-border flex justify-end gap-2.5">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Provisioning Tenant Database...' : 'Create Gym & Provision Schema'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
