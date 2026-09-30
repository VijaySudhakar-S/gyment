'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, message } from 'antd';
import { FEATURES_CONFIG } from '@/data/plans';
import { FeatureLimits } from '@/types/plan';
import { plansApi, PlanData } from '@/lib/api/superadmin/plans.api';

const LIMIT_KEYS = [
  { key: 'Max Members', label: 'Max Members', placeholder: 'e.g. 100 or Unlimited' },
  { key: 'Max Receptionists', label: 'Max Receptionists', placeholder: 'e.g. 2 or Unlimited' },
  { key: 'Max Admins', label: 'Max Admins', placeholder: 'e.g. 1 or Unlimited' },
  { key: 'Max Trainers', label: 'Max Trainers', placeholder: 'e.g. 5 or Unlimited' },
  { key: 'Multiple Branch Management', label: 'Branch Limit', placeholder: 'e.g. 1 branch or Unlimited' },
];

import { FeatureEditorModalProps } from '@/types/modals';

export const FeatureEditorModal: React.FC<FeatureEditorModalProps> = ({ open, onClose, editingPlanKey, onSuccess }) => {

  const [activePlan, setActivePlan] = useState<PlanData | null>(null);
  const [currentFeatures, setCurrentFeatures] = useState<Record<string, boolean>>({});
  const [currentLimits, setCurrentLimits] = useState<FeatureLimits>({});
  const [activeTab, setActiveTab] = useState<'features' | 'limits'>('features');
  const [isSaving, setIsSaving] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!editingPlanKey) return;
    try {
      const res = await plansApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        const found = res.data.find(
          p => p.id === editingPlanKey || p.name.toLowerCase() === editingPlanKey.toLowerCase()
        );
        if (found) {
          setActivePlan(found);
          setCurrentFeatures({ ...(found.features?.enabledFeatures || {}) });
          setCurrentLimits({ ...(found.features?.limits || {}) });
        }
      }
    } catch (error) {
      console.error('Failed to load plan features:', error);
    }
  }, [editingPlanKey]);

  useEffect(() => {
    if (open && editingPlanKey) {
      loadPlan();
    }
  }, [open, editingPlanKey, loadPlan]);

  const toggleFeature = (featKey: string) => {
    setCurrentFeatures(prev => ({
      ...prev,
      [featKey]: !prev[featKey],
    }));
  };

  const updateLimit = (limitKey: string, val: string) => {
    setCurrentLimits(prev => ({
      ...prev,
      [limitKey]: val,
    }));
  };

  const handleSave = async () => {
    if (!activePlan) return;
    try {
      setIsSaving(true);
      const res = await plansApi.updateFeatures({
        planKey: activePlan.name.toLowerCase(),
        features: currentFeatures,
        limits: currentLimits,
      });
      if (res.status) {
        message.success('Plan features updated successfully');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to save features');
    } finally {
      setIsSaving(false);
    }
  };

  const planName = activePlan?.name || 'Plan';

  return (
    <Modal
      open={open}
      onCancel={onClose}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {FEATURES_CONFIG.map((feat) => {
            const isEnabled = !!currentFeatures[feat.key];
            return (
              <div
                key={feat.key}
                onClick={() => toggleFeature(feat.key)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isEnabled
                    ? 'border-primary/40 bg-primary/5 shadow-xs'
                    : 'border-gyment-border bg-white hover:border-gyment-muted/60'
                }`}
              >
                <div className="flex-1 pr-3">
                  <div className="text-xs font-bold text-gyment-text flex items-center gap-1.5">
                    <span>{feat.label}</span>
                  </div>
                  <div className="text-[11px] text-gyment-muted mt-0.5 line-clamp-1">
                    {feat.description}
                  </div>
                  <div className="text-[10px] text-gyment-muted/70 font-mono mt-0.5">
                    {feat.key}
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${
                    isEnabled
                      ? 'bg-primary border-primary text-white'
                      : 'border-gyment-border bg-white'
                  }`}
                >
                  {isEnabled && (
                    <svg
                      className="w-3 h-3 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="bg-gyment-bg/60 border border-gyment-border p-3.5 rounded-xl text-xs text-gyment-muted">
            Define numeric constraints or text rules for this plan tier (e.g. &apos;Unlimited&apos;, &apos;500&apos;, &apos;1 branch&apos;). These limits are enforced in tenant workspaces.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LIMIT_KEYS.map((lim) => (
              <div key={lim.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gyment-text">
                  {lim.label}
                </label>
                <input
                  type="text"
                  placeholder={lim.placeholder}
                  value={currentLimits[lim.key] || ''}
                  onChange={(e) => updateLimit(lim.key, e.target.value)}
                  className="border border-gyment-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gyment-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gyment-border text-xs font-semibold text-gyment-text hover:bg-gyment-bg transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
};
