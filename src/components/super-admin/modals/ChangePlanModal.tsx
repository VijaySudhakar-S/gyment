'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { PlanType } from '@/types/gym';

export const ChangePlanModal: React.FC = () => {
  const {
    changePlanModalOpen,
    setChangePlanModalOpen,
    gyms,
    selectedGymId,
    updateGymPlan,
  } = useSuperAdmin();

  const selectedGym = gyms.find(g => g.id === selectedGymId);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Growth');

  useEffect(() => {
    if (selectedGym) {
      setSelectedPlan(selectedGym.plan);
    }
  }, [selectedGym]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGymId) {
      updateGymPlan(selectedGymId, selectedPlan);
    }
  };

  return (
    <Modal
      open={changePlanModalOpen}
      onCancel={() => setChangePlanModalOpen(false)}
      footer={null}
      width={420}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Change Plan</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Move {selectedGym?.name || 'this gym'} to a different plan
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gyment-text">New Plan</label>
          <select
            value={selectedPlan}
            onChange={e => setSelectedPlan(e.target.value as PlanType)}
            className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white w-full"
          >
            <option value="Starter">Starter (₹499/mo)</option>
            <option value="Growth">Growth (₹999/mo)</option>
            <option value="Pro">Pro (₹1,999/mo)</option>
          </select>
        </div>

        <div className="mt-6 pt-4 border-t border-gyment-border flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setChangePlanModalOpen(false)}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-lg text-sm font-semibold text-gyment-text transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
          >
            Update Plan
          </button>
        </div>
      </form>
    </Modal>
  );
};
