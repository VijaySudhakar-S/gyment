'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { FEATURES_CONFIG, FeatureConfig } from '@/data/plans';
import { FeatureLimits } from '@/types/plan';

const LIMIT_KEYS = [
  { key: 'Max Members', label: 'Max Members', placeholder: 'e.g. 100 or Unlimited' },
  { key: 'Max Receptionists', label: 'Max Receptionists', placeholder: 'e.g. 2 or Unlimited' },
  { key: 'Max Admins', label: 'Max Admins', placeholder: 'e.g. 1 or Unlimited' },
  { key: 'Max Trainers', label: 'Max Trainers', placeholder: 'e.g. 5 or Unlimited' },
  { key: 'Multiple Branch Management', label: 'Branch Limit', placeholder: 'e.g. 1 branch or Unlimited' },
];

export const FeatureEditorModal: React.FC = () => {
  const {
    featureEditorModalOpen,
    setFeatureEditorModalOpen,
    editingPlanKey,
    plans,
    planFeatures,
    featureLimits,
    savePlanFeatures,
  } = useSuperAdmin();

  const [currentFeatures, setCurrentFeatures] = useState<Record<string, boolean>>({});
  const [currentLimits, setCurrentLimits] = useState<FeatureLimits>({});
  const [activeTab, setActiveTab] = useState<'features' | 'limits'>('features');

  const planKey = editingPlanKey || 'starter';
  const planName = plans[planKey]?.name || 'Plan';

  useEffect(() => {
    if (editingPlanKey) {
      setCurrentFeatures({ ...(planFeatures[editingPlanKey] || {}) });
      setCurrentLimits({ ...(featureLimits[editingPlanKey] || {}) });
    }
  }, [editingPlanKey, planFeatures, featureLimits]);

  const toggleFeature = (featKey: string) => {
    setCurrentFeatures(prev => ({
      ...prev,
      [featKey]: !prev[featKey]
    }));
  };

  const updateLimit = (limitKey: string, val: string) => {
    setCurrentLimits(prev => ({
      ...prev,
      [limitKey]: val,
    }));
  };

  const handleSave = () => {
    savePlanFeatures(planKey, currentFeatures, currentLimits);
  };

  return (
    <Modal
      open={featureEditorModalOpen}
      onCancel={() => setFeatureEditorModalOpen(false)}
      footer={null}
      width={900}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">
            Edit {planName} Plan Features & Limits
          </h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Configure feature access flags and capacity limits in JSON for this plan
          </p>
        </div>
      }
    >
      {/* Navigation Tabs */}
      <div className="flex border-b border-gyment-border mt-3 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'features'
              ? 'border-primary text-primary'
              : 'border-transparent text-gyment-muted hover:text-gyment-text'
          }`}
        >
          Feature Access Flags ({Object.values(currentFeatures).filter(Boolean).length} / {FEATURES_CONFIG.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'limits'
              ? 'border-primary text-primary'
              : 'border-transparent text-gyment-muted hover:text-gyment-text'
          }`}
        >
          Capacity Limits (JSON)
        </button>
      </div>

      {activeTab === 'features' ? (
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          {/* Table Header */}
          <div className="grid grid-cols-[200px_90px_1fr] gap-3 pb-2 border-b border-gyment-border text-[11px] font-bold text-gyment-muted uppercase tracking-[0.4px] sticky top-0 bg-white z-10">
            <div>Feature Key</div>
            <div>Enabled</div>
            <div>Description</div>
          </div>

          {/* Feature Rows */}
          <div className="divide-y divide-gyment-border">
            {FEATURES_CONFIG.map((feat: FeatureConfig) => {
              const isEnabled = Boolean(currentFeatures[feat.key]);

              return (
                <div
                  key={feat.key}
                  className="grid grid-cols-[200px_90px_1fr] gap-3 py-2.5 items-center text-[13px]"
                >
                  <div>
                    <div className="font-semibold text-gyment-text">{feat.label}</div>
                    <code className="text-[10px] text-gyment-muted bg-gray-100 px-1 py-0.5 rounded">{feat.key}</code>
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-1.5 text-[12px] cursor-pointer font-medium text-gyment-text">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleFeature(feat.key)}
                        className="accent-primary w-4 h-4 cursor-pointer rounded"
                      />
                      <span className={isEnabled ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                        {isEnabled ? 'Yes' : 'No'}
                      </span>
                    </label>
                  </div>
                  <div className="text-[12px] text-gyment-muted">{feat.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto space-y-4 p-1">
          <p className="text-xs text-gyment-muted">
            Set capacity constraints stored directly inside the plan features JSON object under <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">limits</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LIMIT_KEYS.map((l) => (
              <div key={l.key} className="flex flex-col gap-1.5 border border-gyment-border rounded-lg p-3 bg-white">
                <label className="text-xs font-bold text-gyment-text">{l.label}</label>
                <input
                  type="text"
                  value={currentLimits[l.key] || ''}
                  onChange={(e) => updateLimit(l.key, e.target.value)}
                  placeholder={l.placeholder}
                  className="w-full text-xs border border-gyment-border rounded-md px-3 py-1.5 outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gyment-border flex justify-end gap-2.5">
        <button
          type="button"
          onClick={() => setFeatureEditorModalOpen(false)}
          className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-lg text-sm font-semibold text-gyment-text transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
};
