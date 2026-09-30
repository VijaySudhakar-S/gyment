'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { App, Modal, Table, Select, Input, Button } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  Download,
  Search,
  CreditCard,
  Clock,
  History,
  RotateCw,
} from 'lucide-react';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { ChangePlanModal } from '@/components/super-admin/modals/ChangePlanModal';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { fmtRs } from '@/lib/formatters';
import { subscriptionsApi, SubscriptionItem, SubscriptionKPIs } from '@/lib/api/superadmin/subscriptions.api';
import { plansApi, PlanData } from '@/lib/api/superadmin/plans.api';
import { reportsApi } from '@/lib/api/superadmin/reports.api';
import { StatCardSkeleton, TableSkeleton } from '@/components/shared/skeletons';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [kpis, setKpis] = useState<SubscriptionKPIs>({
    activeSubs: 0,
    trialSubs: 0,
    expiringSubs: 0,
    cancelledSubs: 0,
    suspendedOrPastDue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingExpiry, setIsProcessingExpiry] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModalSub, setDetailModalSub] = useState<SubscriptionItem | null>(null);
  const [historyList, setHistoryList] = useState<SubscriptionItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Debounce search input to avoid hitting API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await subscriptionsApi.getAll({
        search: debouncedSearch || undefined,
        planId: planFilter || undefined,
        status: statusFilter || undefined,
      });

      if (res.status && res.data) {
        setSubscriptions(res.data.subscriptions || []);
        if (res.data.kpis) {
          setKpis(res.data.kpis);
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, planFilter, statusFilter, message]);

  const loadPlans = useCallback(async () => {
    try {
      const res = await plansApi.getAll();
      if (res.status && Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const loadHistory = useCallback(async (gymId: string) => {
    try {
      setIsHistoryLoading(true);
      const res = await subscriptionsApi.getHistory(gymId);
      if (res.status && Array.isArray(res.data)) {
        setHistoryList(res.data);
      }
    } catch (err) {
      console.error('Failed to load subscription history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (detailModalSub?.gymId) {
      loadHistory(detailModalSub.gymId);
    } else {
      setHistoryList([]);
    }
  }, [detailModalSub, loadHistory]);

  const handleRunExpiryCheck = () => {
    modal.confirm({
      title: 'Run Overdue Subscriptions Expiry Check?',
      content: 'This will check all subscriptions against their renewal date. Any active or trial subscriptions past due will be marked as EXPIRED, and gyms without active subscriptions will be suspended.',
      okText: 'Run Check Now',
      centered: true,
      onOk: async () => {
        try {
          setIsProcessingExpiry(true);
          const res = await subscriptionsApi.processExpired();
          if (res.status && res.data) {
            if (res.data.processedCount > 0) {
              message.warning(`Marked ${res.data.processedCount} overdue subscriptions as EXPIRED. Suspended ${res.data.suspendedGymCount} gym(s).`);
            } else {
              message.success('All subscriptions are up-to-date! No overdue subscriptions found.');
            }
            await loadSubscriptions();
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to process expired subscriptions');
        } finally {
          setIsProcessingExpiry(false);
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      const res = await reportsApi.exportData('subscriptions');
      if (res.status && res.data) {
        const blob = new Blob([res.data.content], { type: res.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        message.success('Subscriptions export downloaded successfully');
      }
    } catch (error) {
      message.error('Failed to export subscriptions');
    }
  };

  const openSubDetail = (sub: SubscriptionItem) => {
    setSelectedGymId(sub.gymId);
    setDetailModalSub(sub);
  };

  const handleChangePlan = (sub: SubscriptionItem) => {
    setSelectedGymId(sub.gymId);
    setChangePlanModalOpen(true);
  };

  const handleExtend = (sub: SubscriptionItem) => {
    modal.confirm({
      title: 'Extend subscription?',
      content: `Extend subscription for ${sub.gymName} by 30 days?`,
      okText: 'Extend 30 Days',
      centered : true,
      onOk: async () => {
        try {
          const res = await subscriptionsApi.extend(sub.id, { days: 30 });
          if (res.status) {
            message.success('Subscription extended successfully by 30 days');
            await loadSubscriptions();
            if (detailModalSub?.id === sub.id) {
              setDetailModalSub(res.data);
            }
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to extend subscription');
        }
      },
    });
  };

  const handleCancel = (sub: SubscriptionItem) => {
    modal.confirm({
      title: 'Cancel this subscription?',
      content: `Are you sure you want to cancel the subscription for ${sub.gymName}? The gym will lose access.`,
      okText: 'Confirm Cancellation',
      okType: 'danger',
      centered : true,
      onOk: async () => {
        try {
          const res = await subscriptionsApi.updateStatus(sub.id, { status: 'CANCELLED' });
          if (res.status) {
            message.success('Subscription cancelled successfully');
            await loadSubscriptions();
            if (detailModalSub?.id === sub.id) {
              setDetailModalSub(res.data);
            }
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to cancel subscription');
        }
      },
    });
  };

  const handleSuspend = (sub: SubscriptionItem) => {
    modal.confirm({
      title: 'Suspend this subscription?',
      content: `Are you sure you want to suspend the subscription for ${sub.gymName}?`,
      okText: 'Suspend Subscription',
      okType: 'danger',
      centered : true,
      onOk: async () => {
        try {
          const res = await subscriptionsApi.updateStatus(sub.id, { status: 'PAST_DUE' });
          if (res.status) {
            message.success('Subscription suspended successfully');
            await loadSubscriptions();
            if (detailModalSub?.id === sub.id) {
              setDetailModalSub(res.data);
            }
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to suspend subscription');
        }
      },
    });
  };

  const columns: TableColumnsType<SubscriptionItem> = [
    {
      title: 'GYM',
      dataIndex: 'gymName',
      key: 'gymName',
      render: (_, sub) => (
        <div>
          <div className="font-bold text-gyment-text">{sub.gymName}</div>
          <div className="text-[11px] text-gyment-muted">{sub.gymCode}</div>
        </div>
      ),
    },
    {
      title: 'OWNER',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (val) => val || '-',
    },
    {
      title: 'PLAN',
      dataIndex: 'planName',
      key: 'planName',
      render: (val) => <span className="font-medium text-gyment-text">{val}</span>,
    },
    {
      title: 'BILLING CYCLE',
      dataIndex: 'billingCycle',
      key: 'billingCycle',
    },
    {
      title: 'AMOUNT',
      dataIndex: 'price',
      key: 'price',
      render: (val) => <span className="font-semibold text-gyment-text">{fmtRs(val)}</span>,
    },
    {
      title: 'START DATE',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      title: 'RENEWAL DATE',
      dataIndex: 'renewalDate',
      key: 'renewalDate',
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, sub) => (
        <Button
          size="small"
          onClick={() => openSubDetail(sub)}
          className="text-xs font-semibold"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <Topbar
        title="Subscriptions"
        subtitle="Manage GYMENT SaaS subscriptions across all gyms."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunExpiryCheck}
              disabled={isProcessingExpiry}
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              title="Run automated expiration check for overdue subscriptions"
            >
              <Clock className="w-4 h-4 text-warning" />
              <span className="hidden sm:inline">
                {isProcessingExpiry ? 'Checking...' : 'Process Overdue'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Subscriptions</span>
            </button>
          </div>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* KPI Cards */}
        {isLoading && subscriptions.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCardSkeleton count={5} />
          </div>
        ) : (
          <MotionStagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MotionItem>
              <div onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? '' : 'ACTIVE')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                <StatCard label="Active Subscriptions" value={kpis.activeSubs} delta={statusFilter === 'ACTIVE' ? 'Active Filter' : 'Billing normally'} deltaType="up" />
              </div>
            </MotionItem>
            <MotionItem>
              <div onClick={() => setStatusFilter(statusFilter === 'TRIAL' ? '' : 'TRIAL')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                <StatCard label="Trial Subscriptions" value={kpis.trialSubs} delta={statusFilter === 'TRIAL' ? 'Trial Filter' : 'Converting'} deltaType="neu" />
              </div>
            </MotionItem>
            <MotionItem>
              <div onClick={() => setStatusFilter(statusFilter === 'EXPIRING' ? '' : 'EXPIRING')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                <StatCard label="Expiring Soon" value={kpis.expiringSubs} delta={statusFilter === 'EXPIRING' ? 'Expiring Filter' : 'Within 30 days'} deltaType={kpis.expiringSubs > 0 ? 'down' : 'neu'} />
              </div>
            </MotionItem>
            <MotionItem>
              <div onClick={() => setStatusFilter(statusFilter === 'CANCELLED' ? '' : 'CANCELLED')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                <StatCard label="Cancelled" value={kpis.cancelledSubs} delta={statusFilter === 'CANCELLED' ? 'Cancelled Filter' : 'Past churn'} deltaType="neu" />
              </div>
            </MotionItem>
            <MotionItem>
              <div onClick={() => setStatusFilter(statusFilter === 'PAST_DUE' ? '' : 'PAST_DUE')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                <StatCard label="Suspended / Past Due" value={kpis.suspendedOrPastDue} delta={statusFilter === 'PAST_DUE' ? 'Past Due Filter' : 'Action required'} deltaType={kpis.suspendedOrPastDue > 0 ? 'down' : 'neu'} />
              </div>
            </MotionItem>
          </MotionStagger>
        )}

        {/* AntD Filter Bar */}
        <MotionFadeIn delay={0.06} className="flex items-center gap-2.5 flex-wrap">
          <Input
            prefix={<Search className="w-4 h-4 text-gyment-muted mr-1" />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search gym, owner, or code…"
            className="w-56"
            allowClear
          />

          <Select
            allowClear
            placeholder="All Plans"
            value={planFilter || undefined}
            onChange={val => setPlanFilter(val || '')}
            className="w-44 text-xs"
            options={plans.map(p => ({ value: p.id, label: p.name }))}
          />

          <Select
            allowClear
            placeholder="All Statuses"
            value={statusFilter || undefined}
            onChange={val => setStatusFilter(val || '')}
            className="w-44 text-xs"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'TRIAL', label: 'Trial' },
              { value: 'EXPIRING', label: 'Expiring Soon (30d)' },
              { value: 'PAST_DUE', label: 'Past Due' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'EXPIRED', label: 'Expired' },
            ]}
          />
        </MotionFadeIn>

        {/* AntD Subscriptions Table */}
        <MotionFadeIn delay={0.1} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
          {isLoading && subscriptions.length === 0 ? (
            <TableSkeleton rows={6} columns={7} />
          ) : (
            <Table<SubscriptionItem>
              columns={columns}
              dataSource={subscriptions}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} subscriptions`,
              }}
              locale={{
                emptyText: (
                  <div className="flex flex-col items-center py-6">
                    <CreditCard className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                    <div className="font-bold text-sm text-gyment-text mb-1">
                      No subscriptions found
                    </div>
                    <div className="text-xs text-gyment-muted">
                      Try adjusting your filters or search query.
                    </div>
                  </div>
                ),
              }}
            />
          )}
        </MotionFadeIn>

        {/* Subscription Detail Modal */}
        {detailModalSub && (
          <Modal
            open={!!detailModalSub}
            onCancel={() => setDetailModalSub(null)}
            footer={null}
            width={650}
            centered
            title={
              <div className="flex justify-between items-center pr-6 pt-1">
                <div>
                  <h2 className="text-[16px] font-bold text-gyment-text m-0">
                    {detailModalSub.gymName}
                  </h2>
                  <p className="text-[12px] text-gyment-muted mt-0.5">
                    Owner: {detailModalSub.ownerName || 'N/A'} • {detailModalSub.contactEmail || ''}
                  </p>
                </div>
                <StatusBadge status={detailModalSub.status} />
              </div>
            }
          >
            <div className="pt-4 space-y-5">
              {/* Plan and Billing Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="border border-gyment-border rounded-xl p-4 bg-gyment-bg">
                  <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2">Current Plan</h3>
                  <div className="text-[18px] font-extrabold text-gyment-text">
                    {detailModalSub.planName}
                  </div>
                  <div className="text-[20px] font-extrabold text-gyment-text mt-1">
                    {fmtRs(detailModalSub.price)}
                    <span className="text-[12px] text-gyment-muted font-normal">
                      /{detailModalSub.billingCycle === 'YEARLY' ? 'year' : 'month'}
                    </span>
                  </div>
                  {detailModalSub.notes && (
                    <div className="mt-3 pt-2 text-[11px] text-gyment-muted border-t border-dashed border-gyment-border">
                      <b>Notes:</b> {detailModalSub.notes}
                    </div>
                  )}
                </div>

                <div className="border border-gyment-border rounded-xl p-4">
                  <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2">Billing Schedule</h3>
                  <div className="space-y-1 text-[12.5px]">
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Cycle</span>
                      <span className="font-semibold text-gyment-text">{detailModalSub.billingCycle}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Amount</span>
                      <span className="font-semibold text-gyment-text">{fmtRs(detailModalSub.price)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Start Date</span>
                      <span className="font-semibold text-gyment-text">{new Date(detailModalSub.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Renewal Date</span>
                      <span className="font-semibold text-gyment-text">{new Date(detailModalSub.renewalDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription History Timeline */}
              <div className="border border-gyment-border rounded-xl p-4 bg-gyment-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-bold text-gyment-text m-0 flex items-center gap-1.5">
                    <History size={14} className="text-gyment-primary" />
                    Subscription History & Lifecycle
                  </h3>
                  <span className="text-[11px] text-gyment-muted">
                    {historyList.length} recorded {historyList.length === 1 ? 'cycle' : 'cycles'}
                  </span>
                </div>

                {isHistoryLoading ? (
                  <div className="py-4 text-center text-xs text-gyment-muted flex items-center justify-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-gyment-primary" />
                    Loading subscription history...
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="py-2 text-xs text-gyment-muted">No prior subscription history recorded.</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {historyList.map((histSub) => (
                      <div
                        key={histSub.id}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-colors ${
                          histSub.id === detailModalSub.id
                            ? 'border-gyment-primary/40 bg-gyment-primary/5'
                            : 'border-gyment-border/70 bg-gyment-bg/60'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-gyment-text">{histSub.planName}</span>
                            <span className="text-[10px] text-gyment-muted">({histSub.billingCycle})</span>
                            {histSub.id === detailModalSub.id && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gyment-text">{fmtRs(histSub.price)}</span>
                            <StatusBadge status={histSub.status} />
                          </div>
                        </div>

                        <div className="flex justify-between text-[11px] text-gyment-muted">
                          <span>
                            {new Date(histSub.startDate).toLocaleDateString()} →{' '}
                            {new Date(histSub.renewalDate).toLocaleDateString()}
                          </span>
                          <span>Recorded {new Date(histSub.createdAt).toLocaleDateString()}</span>
                        </div>

                        {histSub.notes && (
                          <div className="text-[10.5px] text-gyment-muted italic pt-0.5 border-t border-dashed border-gyment-border/50">
                            {histSub.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gyment-border flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    handleChangePlan(detailModalSub);
                    setDetailModalSub(null);
                  }}
                  className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Change Plan
                </button>
                <button
                  type="button"
                  onClick={() => handleExtend(detailModalSub)}
                  className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold text-gyment-text transition-colors cursor-pointer"
                >
                  Extend 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(detailModalSub)}
                  className="border border-danger-light bg-danger-light text-danger hover:bg-danger hover:text-white px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer"
                >
                  Cancel Subscription
                </button>
                <button
                  type="button"
                  onClick={() => handleSuspend(detailModalSub)}
                  className="border border-danger-light bg-danger-light text-danger hover:bg-danger hover:text-white px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer"
                >
                  Suspend Subscription
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
      <ChangePlanModal
        open={changePlanModalOpen}
        onClose={() => setChangePlanModalOpen(false)}
        gymId={selectedGymId}
        onSuccess={() => {
          loadSubscriptions();
          setDetailModalSub(null); 
        }}
      />
    </>
  );
}
