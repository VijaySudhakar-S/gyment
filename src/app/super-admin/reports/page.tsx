'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { App } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { reportsApi, ReportMetricsData } from '@/lib/api/superadmin/reports.api';
import { fmtRs } from '@/lib/formatters';

export default function ReportsPage() {
  const { message } = App.useApp();

  const [metrics, setMetrics] = useState<ReportMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await reportsApi.getMetrics();
      if (res.status && res.data) {
        setMetrics(res.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load platform reports');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = async (type: 'gyms' | 'subscriptions' | 'revenue' | 'users') => {
    try {
      const res = await reportsApi.exportData(type);
      if (res.status && res.data) {
        const blob = new Blob([res.data.content], { type: res.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        message.success(`${type.toUpperCase()} report exported successfully`);
      }
    } catch (error: any) {
      message.error(error.message || `Failed to export ${type} report`);
    }
  };

  const gymData = metrics?.gyms;
  const subData = metrics?.subscriptions;
  const userData = metrics?.users;

  return (
    <>
      <Topbar
        title="Reports"
        subtitle="Platform-level performance and audit reports."
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
                <span className="font-semibold text-gyment-text">{gymData?.totalGyms ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">New this month</span>
                <span className="font-semibold text-gyment-text">{gymData?.newThisMonth ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Active</span>
                <span className="font-semibold text-gyment-text">{gymData?.activeGyms ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Suspended</span>
                <span className="font-semibold text-gyment-text">{gymData?.suspendedGyms ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Inactive / Cancelled</span>
                <span className="font-semibold text-gyment-text">{gymData?.cancelledGyms ?? 0}</span>
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
                <span className="text-gyment-muted">Total Subscriptions</span>
                <span className="font-semibold text-gyment-text">{subData?.totalSubscriptions ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Active Subscriptions</span>
                <span className="font-semibold text-gyment-text">{subData?.activeSubscriptions ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Trial Subscriptions</span>
                <span className="font-semibold text-gyment-text">{subData?.trialSubscriptions ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Past Due / Overdue</span>
                <span className="font-semibold text-gyment-text">{subData?.pastDueSubscriptions ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Annual Run Rate</span>
                <span className="font-semibold text-gyment-text">{fmtRs(subData?.arr ?? 0)}</span>
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
                <span className="text-gyment-muted">Monthly Recurring</span>
                <span className="font-semibold text-gyment-text">{fmtRs(subData?.mrr ?? 0)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Annual Recurring</span>
                <span className="font-semibold text-gyment-text">{fmtRs(subData?.arr ?? 0)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Active Paying Facilities</span>
                <span className="font-semibold text-gyment-text">{subData?.activeSubscriptions ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Avg Monthly Revenue</span>
                <span className="font-semibold text-gyment-text">
                  {subData?.activeSubscriptions ? fmtRs(Math.round((subData?.mrr ?? 0) / subData.activeSubscriptions)) : '₹0'}
                </span>
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
                <span className="text-gyment-muted">Total platform users</span>
                <span className="font-semibold text-gyment-text">{userData?.totalUsers ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Super Admins</span>
                <span className="font-semibold text-gyment-text">{userData?.superAdmins ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Gym Owners / Admins</span>
                <span className="font-semibold text-gyment-text">{userData?.gymOwners ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Staff / Receptionists</span>
                <span className="font-semibold text-gyment-text">{userData?.staffUsers ?? 0}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gyment-muted">Trainers</span>
                <span className="font-semibold text-gyment-text">{userData?.trainers ?? 0}</span>
              </div>
            </div>
          </MotionItem>
        </MotionStagger>

        {/* Export Section */}
        <MotionFadeIn delay={0.15}>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Export Platform Data</h2>
              <p className="text-[12px] text-gyment-muted m-0">Generate live CSV data reports from PostgreSQL</p>
            </div>
          </div>

          <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <div className="flex gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleExport('gyms')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Gyms (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('subscriptions')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Subscriptions (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('revenue')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Revenue (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('users')}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Users (CSV)</span>
              </button>
            </div>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
