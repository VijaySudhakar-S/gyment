'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { App } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';

export default function ReportsPage() {
  const { message } = App.useApp();
  const { gyms, users } = useSuperAdmin();

  const totalGyms = gyms.length;
  const activeGyms = gyms.filter(g => g.gymStatus === 'Active').length;
  const suspendedGyms = gyms.filter(g => g.gymStatus === 'Suspended').length;
  const cancelledGyms = gyms.filter(g => g.gymStatus === 'Cancelled').length;

  const activeSubs = gyms.filter(g => g.subStatus === 'Active').length;
  const trialSubs = gyms.filter(g => g.subStatus === 'Trial').length;

  const totalUsers = users.length;
  const ownerUsers = users.filter(u => u.role === 'Gym Owner').length;
  const staffUsers = users.filter(u => u.role === 'Staff').length;
  const trainerUsers = users.filter(u => u.role === 'Trainer').length;

  const handleExport = (type: string) => {
    message.success(`Demo export prepared for ${type}`);
  };

  return (
    <>
      <Topbar
        title="Reports"
        subtitle="Platform-level performance reports."
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* Reports 4-Card Grid */}
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Gym Reports */}
          <MotionItem className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2.5">
              Gym Reports
            </h3>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Total gyms</span>
                <span className="font-semibold text-gyment-text">{totalGyms}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">New this month</span>
                <span className="font-semibold text-gyment-text">9</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Active</span>
                <span className="font-semibold text-gyment-text">{activeGyms}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Suspended</span>
                <span className="font-semibold text-gyment-text">{suspendedGyms}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Cancelled</span>
                <span className="font-semibold text-gyment-text">{cancelledGyms}</span>
              </div>
            </div>
          </MotionItem>

          {/* Subscription Reports */}
          <MotionItem className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2.5">
              Subscription Reports
            </h3>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Active</span>
                <span className="font-semibold text-gyment-text">{activeSubs}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Trial</span>
                <span className="font-semibold text-gyment-text">{trialSubs}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Upgrades (30d)</span>
                <span className="font-semibold text-gyment-text">6</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Downgrades (30d)</span>
                <span className="font-semibold text-gyment-text">1</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Renewals (30d)</span>
                <span className="font-semibold text-gyment-text">34</span>
              </div>
            </div>
          </MotionItem>

          {/* Revenue Reports */}
          <MotionItem className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2.5">
              Revenue Reports
            </h3>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Monthly revenue</span>
                <span className="font-semibold text-gyment-text">₹16.9L</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Annual revenue</span>
                <span className="font-semibold text-gyment-text">₹1.42Cr</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Top plan by revenue</span>
                <span className="font-semibold text-gyment-text">Growth</span>
              </div>
            </div>
          </MotionItem>

          {/* User Reports */}
          <MotionItem className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <h3 className="text-[13px] font-bold text-gyment-text m-0 mb-2.5">
              User Reports
            </h3>
            <div className="space-y-1 text-[13px]">
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Total users</span>
                <span className="font-semibold text-gyment-text">{totalUsers}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Owners</span>
                <span className="font-semibold text-gyment-text">{ownerUsers}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Staff</span>
                <span className="font-semibold text-gyment-text">{staffUsers}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Trainers</span>
                <span className="font-semibold text-gyment-text">{trainerUsers}</span>
              </div>
            </div>
          </MotionItem>
        </MotionStagger>

        {/* Export Section */}
        <MotionFadeIn delay={0.15}>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Export</h2>
              <p className="text-[12px] text-gyment-muted m-0">Download platform report data</p>
            </div>
          </div>

          <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <div className="flex gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleExport('Gyms (CSV)')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Gyms (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('Subscriptions (CSV)')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Subscriptions (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('Revenue (Excel)')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Revenue (Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('Users (Excel)')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Users (Excel)</span>
              </button>
            </div>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
