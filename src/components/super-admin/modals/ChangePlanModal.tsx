import React, { useState, useEffect, useCallback } from 'react';
import { Modal, message, Select, Button, Input } from 'antd';
import { plansApi, PlanData } from '@/lib/api/superadmin/plans.api';
import { gymsApi, GymData } from '@/lib/api/superadmin/gyms.api';
import { subscriptionsApi, PlanChangePreviewData } from '@/lib/api/superadmin/subscriptions.api';
import { FormSkeleton } from '@/components/shared/skeletons';
import { fmtRs } from '@/lib/formatters';
import { Calendar, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';

import { ChangePlanModalProps } from '@/types/modals';

export const ChangePlanModal: React.FC<ChangePlanModalProps> = ({ open, onClose, gymId, onSuccess }) => {
  const [gym, setGym] = useState<GymData | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [notes, setNotes] = useState<string>('');
  const [previewData, setPreviewData] = useState<PlanChangePreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!gymId) return;
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    if (open && gymId) {
      loadData();
    }
  }, [open, gymId, loadData]);

  // Fetch proration preview whenever selectedPlanId or billingCycle changes
  useEffect(() => {
    if (!open || !gymId || !selectedPlanId) {
      setPreviewData(null);
      return;
    }

    let isMounted = true;
    const fetchPreview = async () => {
      try {
        setIsPreviewLoading(true);
        const res = await subscriptionsApi.previewPlanChange(String(gymId), selectedPlanId, billingCycle);
        if (isMounted && res.status && res.data) {
          setPreviewData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch proration preview:', err);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [open, gymId, selectedPlanId, billingCycle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId || !selectedPlanId) return;

    try {
      setIsSubmitting(true);
      const res = await subscriptionsApi.changePlan({
        gymId: String(gymId),
        planId: selectedPlanId,
        billingCycle,
        notes: notes.trim() || undefined,
      });

      if (res.status) {
        message.success('Subscription plan updated and previous plan archived in history');
        setNotes('');
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
      width={500}
      centered
      title={
        <div className="pt-1">
          <h2 className="text-base font-bold text-gyment-text m-0">Change Subscription Plan</h2>
          <p className="text-xs text-gyment-muted mt-0.5">
            Upgrade or switch plan tier for <span className="font-semibold text-gyment-primary">{gym?.name || 'this gym'}</span>
          </p>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-4">
          <FormSkeleton fields={2} columns={1} />
        </div>
      ) : (
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
                { value: 'YEARLY', label: 'Yearly Billing (Discounted Annual)' },
              ]}
            />
          </div>

          {/* Proration & Price Preview */}
          {previewData && (
            <div className="rounded-xl border border-gyment-border bg-gyment-card/60 p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gyment-border/60">
                <span className="font-bold text-gyment-text flex items-center gap-1.5">
                  <Sparkles size={14} className="text-gyment-primary" />
                  Proration & Pricing Preview
                </span>
                {isPreviewLoading && (
                  <span className="text-[10px] text-gyment-muted">Calculating...</span>
                )}
              </div>

              {previewData.currentSubscription && (
                <div className="flex items-center justify-between text-gyment-muted">
                  <span>Current: {previewData.currentSubscription.planName} ({previewData.proration.daysRemaining} days left)</span>
                  <span>{fmtRs(previewData.currentSubscription.price)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-gyment-muted">
                <span>New Plan Base Price</span>
                <span className="font-medium text-gyment-text">{fmtRs(previewData.newPlan.price)}</span>
              </div>

              {previewData.proration.unusedCredit > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Unused Credit Adjustment</span>
                  <span>-{fmtRs(previewData.proration.unusedCredit)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gyment-border/60 font-bold text-sm text-gyment-text">
                <span>Net Payable:</span>
                <span className="text-gyment-primary text-base">{fmtRs(previewData.proration.netPayable)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gyment-muted pt-1">
                <Calendar size={12} />
                <span>
                  Next Renewal: {new Date(previewData.proration.newRenewalDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gyment-text">Change Notes (Optional)</label>
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Upgraded to Pro per gym owner request"
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="text-[11px] text-gyment-muted flex items-start gap-1.5 bg-gyment-primary/5 p-2 rounded-lg border border-gyment-primary/10">
            <CheckCircle2 size={13} className="text-gyment-primary shrink-0 mt-0.5" />
            <span>
              Previous subscription will be safely archived in gym subscription history. Full audit trail is maintained.
            </span>
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
              Confirm Plan Change
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

