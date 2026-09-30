'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { App, Modal, Table, Select, Input, Button } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  Download,
  Search,
  CreditCard,
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

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModalSub, setDetailModalSub] = useState<SubscriptionItem | null>(null);

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
          <button
            type="button"
            onClick={handleExport}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Subscriptions</span>
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* KPI Cards */}
        <MotionStagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <MotionItem><StatCard label="Active Subscriptions" value={kpis.activeSubs} delta="Billing normally" deltaType="up" /></MotionItem>
          <MotionItem><StatCard label="Trial Subscriptions" value={kpis.trialSubs} delta="Converting" deltaType="neu" /></MotionItem>
          <MotionItem><StatCard label="Expiring Soon" value={kpis.expiringSubs} delta="Within 30 days" deltaType={kpis.expiringSubs > 0 ? 'down' : 'neu'} /></MotionItem>
          <MotionItem><StatCard label="Cancelled" value={kpis.cancelledSubs} delta="Past churn" deltaType="neu" /></MotionItem>
          <MotionItem><StatCard label="Suspended / Past Due" value={kpis.suspendedOrPastDue} delta="Action required" deltaType={kpis.suspendedOrPastDue > 0 ? 'down' : 'neu'} /></MotionItem>
        </MotionStagger>

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
            className="w-40 text-xs"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'TRIAL', label: 'Trial' },
              { value: 'PAST_DUE', label: 'Past Due' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'EXPIRED', label: 'Expired' },
            ]}
          />
        </MotionFadeIn>

        {/* AntD Subscriptions Table */}
        <MotionFadeIn delay={0.1} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden shadow-2xs">
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
