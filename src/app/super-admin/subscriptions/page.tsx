'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, message } from 'antd';
import {
  Download,
  Search,
  CreditCard,
} from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { Gym, SubscriptionStatus, PlanType } from '@/types/gym';
import { fmtRs } from '@/lib/formatters';

export default function SubscriptionsPage() {
  const router = useRouter();
  const {
    gyms,
    subHistory,
    setSelectedGymId,
    setChangePlanModalOpen,
    extendSubscription,
    cancelSubscription,
    suspendSubscription,
    openConfirmModal,
  } = useSuperAdmin();

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModalGym, setDetailModalGym] = useState<Gym | null>(null);

  // KPIs
  const activeSubs = gyms.filter(g => g.subStatus === 'Active').length;
  const trialSubs = gyms.filter(g => g.subStatus === 'Trial').length;
  const expiringSubs = 3;
  const cancelledSubs = gyms.filter(g => g.subStatus === 'Cancelled').length;
  const suspendedOrPastDue = gyms.filter(
    g => g.subStatus === 'Suspended' || g.subStatus === 'Past Due'
  ).length;

  const filteredSubs = useMemo(() => {
    return gyms.filter(g => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.owner.toLowerCase().includes(q);

      const matchPlan = !planFilter || g.plan === planFilter;
      const matchStatus = !statusFilter || g.subStatus === statusFilter;

      return matchSearch && matchPlan && matchStatus;
    });
  }, [gyms, search, planFilter, statusFilter]);

  const handleExport = () => {
    message.success('Subscriptions export prepared');
  };

  const openSubDetail = (gym: Gym) => {
    setSelectedGymId(gym.id);
    setDetailModalGym(gym);
  };

  const handleChangePlan = (gym: Gym) => {
    setSelectedGymId(gym.id);
    setChangePlanModalOpen(true);
  };

  const handleExtend = (gym: Gym) => {
    extendSubscription(gym.id);
  };

  const handleCancel = (gym: Gym) => {
    openConfirmModal({
      title: 'Cancel this subscription?',
      body: 'Are you sure you want to cancel this subscription? The gym will lose access at the end of the billing period.',
      actionLabel: 'Confirm Cancellation',
      isDanger: true,
      onConfirm: () => {
        cancelSubscription(gym.id);
        if (detailModalGym?.id === gym.id) {
          setDetailModalGym(prev => (prev ? { ...prev, subStatus: 'Cancelled' } : null));
        }
      },
    });
  };

  const handleSuspend = (gym: Gym) => {
    openConfirmModal({
      title: 'Suspend this subscription?',
      body: 'Are you sure you want to suspend this subscription?',
      actionLabel: 'Suspend Subscription',
      isDanger: true,
      onConfirm: () => {
        suspendSubscription(gym.id);
        if (detailModalGym?.id === gym.id) {
          setDetailModalGym(prev => (prev ? { ...prev, subStatus: 'Suspended' } : null));
        }
      },
    });
  };

  return (
    <>
      <Topbar
        title="Subscriptions"
        subtitle="Manage gym subscriptions and billing status."
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="border border-[#E3E8E5] bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-[#232D27] flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* Subscription KPI Row */}
        <MotionStagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MotionItem><StatCard label="Active Subscriptions" value={activeSubs} /></MotionItem>
          <MotionItem><StatCard label="Trial Subscriptions" value={trialSubs} /></MotionItem>
          <MotionItem><StatCard label="Expiring Soon" value={expiringSubs} /></MotionItem>
          <MotionItem><StatCard label="Cancelled" value={cancelledSubs} /></MotionItem>
          <MotionItem><StatCard label="Suspended / Past Due" value={suspendedOrPastDue} /></MotionItem>
        </MotionStagger>

        {/* Filters */}
        <MotionFadeIn delay={0.08} className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gyment-border rounded-lg px-3 py-1.5 w-52.5 focus-within:border-primary">
            <Search className="w-4 h-4 text-gyment-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search gym or owner…"
              className="bg-transparent border-none outline-none text-[12.5px] text-gyment-text placeholder-gyment-muted w-full"
            />
          </div>

          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="border border-gyment-border rounded-lg px-3 py-1.5 text-[12.5px] bg-white text-gyment-text outline-none focus:border-primary"
          >
            <option value="">All Plans</option>
            <option value="Starter">Starter</option>
            <option value="Growth">Growth</option>
            <option value="Pro">Pro</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gyment-border rounded-lg px-3 py-1.5 text-[12.5px] bg-white text-gyment-text outline-none focus:border-primary"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Past Due">Past Due</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Suspended">Suspended</option>
          </select>
        </MotionFadeIn>

        {/* Subscriptions Table */}
        <MotionFadeIn delay={0.14} className="bg-white border border-gyment-border rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Gym
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Owner
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Plan
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Billing Cycle
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Start Date
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Next Billing
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-2.5 border-b border-gyment-border"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gyment-border">
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gyment-muted">
                      <div className="flex flex-col items-center">
                        <CreditCard className="w-9 h-9 mb-2.5 opacity-40 text-gyment-muted" />
                        <div className="font-bold text-sm text-gyment-text mb-1">
                          No subscriptions found
                        </div>
                        <div className="text-xs">
                          Try adjusting your filters or search query.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map(gym => (
                    <tr key={gym.id} className="hover:bg-gyment-bg transition-colors">
                      <td className="px-3 py-2.5 font-bold text-gyment-text">{gym.name}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.owner}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.plan}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.cycle}</td>
                      <td className="px-3 py-2.5 font-semibold text-gyment-text">
                        {fmtRs(gym.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.start}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.nextBilling}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={gym.subStatus} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => openSubDetail(gym)}
                          className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors shadow-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </MotionFadeIn>

        {/* Subscription Detail Modal */}
        {detailModalGym && (
          <Modal
            open={!!detailModalGym}
            onCancel={() => setDetailModalGym(null)}
            footer={null}
            width={650}
            centered
            title={
              <div className="flex justify-between items-center pr-6 pt-1">
                <div>
                  <h2 className="text-[16px] font-bold text-gyment-text m-0">
                    {detailModalGym.name}
                  </h2>
                  <p className="text-[12px] text-gyment-muted mt-0.5">
                    Owned by {detailModalGym.owner}
                  </p>
                </div>
                <StatusBadge status={detailModalGym.subStatus} />
              </div>
            }
          >
            <div className="pt-4 space-y-5">
              {/* Plan and Billing Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="border border-gyment-border rounded-[12px] p-4 bg-gyment-bg">
                  <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2">Current Plan</h3>
                  <div className="text-[18px] font-extrabold text-gyment-text">
                    {detailModalGym.plan}
                  </div>
                  <div className="text-[20px] font-extrabold text-gyment-text mt-1">
                    {fmtRs(detailModalGym.amount)}
                    <span className="text-[12px] text-gyment-muted font-normal">
                      /{detailModalGym.cycle === 'Yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-dashed border-gyment-border flex justify-between text-[11.5px] text-gyment-muted">
                    <span>Members</span>
                    <b className="text-gyment-text">{detailModalGym.members}</b>
                  </div>
                  <div className="mt-1 flex justify-between text-[11.5px] text-gyment-muted">
                    <span>Staff</span>
                    <b className="text-gyment-text">{detailModalGym.staff}</b>
                  </div>
                </div>

                <div className="border border-gyment-border rounded-[12px] p-4">
                  <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2">Billing</h3>
                  <div className="space-y-1 text-[12.5px]">
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Cycle</span>
                      <span className="font-semibold text-gyment-text">{detailModalGym.cycle}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Amount</span>
                      <span className="font-semibold text-gyment-text">{fmtRs(detailModalGym.amount)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Start Date</span>
                      <span className="font-semibold text-gyment-text">{detailModalGym.start}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                      <span className="text-gyment-muted">Renewal Date</span>
                      <span className="font-semibold text-gyment-text">{detailModalGym.nextBilling}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription History */}
              <div>
                <h3 className="text-[13.5px] font-bold text-gyment-text mb-2">Subscription History</h3>
                <div className="border border-gyment-border rounded-[10px] p-3 text-[12.5px] bg-white">
                  {(subHistory[detailModalGym.id] || []).length > 0 ? (
                    subHistory[detailModalGym.id].map((h, i) => (
                      <div
                        key={i}
                        className="flex justify-between py-1.5 border-b border-dashed border-gyment-border last:border-b-0"
                      >
                        <span className="text-gyment-muted">
                          {h.from} → <b className="text-gyment-text">{h.to}</b>
                        </span>
                        <span className="text-gyment-text font-medium">{h.date}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gyment-muted">
                      No plan changes recorded for this gym yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gyment-border flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    handleChangePlan(detailModalGym);
                    setDetailModalGym(null);
                  }}
                  className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Change Plan
                </button>
                <button
                  type="button"
                  onClick={() => handleExtend(detailModalGym)}
                  className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold text-gyment-text transition-colors"
                >
                  Extend Subscription
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(detailModalGym)}
                  className="border border-danger-light bg-danger-light text-danger hover:bg-danger hover:text-white px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors"
                >
                  Cancel Subscription
                </button>
                <button
                  type="button"
                  onClick={() => handleSuspend(detailModalGym)}
                  className="border border-danger-light bg-danger-light text-danger hover:bg-danger hover:text-white px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors"
                >
                  Suspend Subscription
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </>
  );
}
