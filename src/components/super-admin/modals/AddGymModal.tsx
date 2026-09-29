'use client';

import React, { useState } from 'react';
import { Modal } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';

export const AddGymModal: React.FC = () => {
  const { addGymModalOpen, setAddGymModalOpen, addGym, planList } = useSuperAdmin();

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

  // Set default selectedPlanId when modal opens or planList loads
  React.useEffect(() => {
    if (planList.length > 0 && !selectedPlanId) {
      setSelectedPlanId(planList[0].id);
    }
  }, [planList, selectedPlanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adminName.trim() || !adminEmail.trim() || !adminPhone.trim() || !selectedPlanId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await addGym({
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

      // Reset form
      setName('');
      setLocation('');
      setAdminName('');
      setAdminEmail('');
      setAdminPhone('');
      setPassword('');
      setBillingCycle('MONTHLY');
      setStatus('ACTIVE');
    } catch {
      // Error notification handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={addGymModalOpen}
      onCancel={() => setAddGymModalOpen(false)}
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
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Flex Arena Gym"
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Location / Branch</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Jubilee Hills, Hyderabad"
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
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
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Admin Email *</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@flexarena.com"
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Admin Phone Number *</label>
              <input
                type="tel"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">
                Initial Admin Password <span className="font-normal text-gyment-muted">(leave blank for default)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty to use default password (GymentAdmin@123)"
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
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
              <select
                required
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white cursor-pointer"
              >
                {planList.length === 0 ? (
                  <option value="">Loading plans...</option>
                ) : (
                  planList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.monthlyPrice}/mo)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as 'MONTHLY' | 'YEARLY')}
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white cursor-pointer"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gyment-text">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'TRIAL')}
                className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white cursor-pointer"
              >
                <option value="ACTIVE">Active Subscription</option>
                <option value="TRIAL">Trial Period</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gyment-border flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setAddGymModalOpen(false)}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-lg text-sm font-semibold text-gyment-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Gym...' : 'Create Gym & Provision Schema'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
