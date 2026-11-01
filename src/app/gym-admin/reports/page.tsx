'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  OwnerFinancialHealthBar,
  RevenueAndGrowthChart,
  PlanDistributionReportCard,
  OperationsAndMethodsCard,
} from '@/components/gym-admin/reports/ReportsComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { App, Dropdown, Select, DatePicker, Button } from 'antd';
import type { MenuProps } from 'antd';
import { Download, Calendar, FileText, FileSpreadsheet, ChevronDown, RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

export default function GymAdminReportsPage() {
  const { message } = App.useApp();
  const [dateFilter, setDateFilter] = useState<string>('30d');
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<{
    summary: any;
    monthlyTrends: any[];
    planDistribution: any[];
    paymentsByMethod: any[];
    hourlyPeakReport: any[];
  } | null>(null);

  const fetchReportsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { range: dateFilter };
      if (dateFilter === 'custom' && customRange && customRange[0] && customRange[1]) {
        params.startDate = customRange[0].format('YYYY-MM-DD');
        params.endDate = customRange[1].format('YYYY-MM-DD');
      }
      const analyticsRes = await gymAdminApi.getReportsAnalytics(params);
      if (analyticsRes?.status && analyticsRes?.data) {
        setReportData(analyticsRes.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
      message.error('Failed to load reports data');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, customRange, message]);

  useEffect(() => {
    if (dateFilter === 'custom' && (!customRange || !customRange[0] || !customRange[1])) {
      return; // wait until user selects both dates
    }
    fetchReportsData();
  }, [fetchReportsData, dateFilter, customRange]);

  // Export handlers
  const handleExport = (type: 'pdf' | 'excel') => {
    if (!reportData) {
      message.warning('No report data available to export');
      return;
    }

    try {
      const summary = reportData.summary;
      const plans = reportData.planDistribution || [];
      const trends = reportData.monthlyTrends || [];

      if (type === 'pdf') {
        // Generates print/save as PDF window with clean audit layout
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          message.error('Please allow popups to export PDF');
          return;
        }

        const dateRangeLabel =
          dateFilter === '30d'
            ? 'Last 30 Days'
            : dateFilter === 'last_month'
            ? 'Last Month'
            : dateFilter === '6m'
            ? 'Last 6 Months'
            : dateFilter === '1y'
            ? 'Past 1 Year'
            : customRange
            ? `${customRange[0].format('DD MMM YYYY')} to ${customRange[1].format('DD MMM YYYY')}`
            : 'All Time';

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>GYMENT — Performance & Financial Audit Report</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #16211B; padding: 36px; margin: 0; }
                h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; color: #10B981; }
                .subtitle { font-size: 13px; color: #6B7280; margin-bottom: 24px; }
                .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
                .kpi-card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px; }
                .kpi-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6B7280; margin-bottom: 6px; }
                .kpi-val { font-size: 20px; font-weight: 900; color: #111827; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; font-size: 12px; }
                th { background: #F3F4F6; text-align: left; padding: 10px; font-weight: 700; border-bottom: 1px solid #D1D5DB; }
                td { padding: 9px 10px; border-bottom: 1px solid #E5E7EB; }
                .section-title { font-size: 15px; font-weight: 800; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #10B981; padding-bottom: 4px; }
                .footer { font-size: 11px; color: #9CA3AF; text-align: center; margin-top: 36px; border-top: 1px dashed #D1D5DB; padding-top: 12px; }
              </style>
            </head>
            <body>
              <h1>GYMENT — Performance & Audit Report</h1>
              <div class="subtitle">Generated on ${new Date().toLocaleString()} · Time Window: <b>${dateRangeLabel}</b></div>

              <div class="kpi-grid">
                <div class="kpi-card">
                  <div class="kpi-label">This Month Revenue</div>
                  <div class="kpi-val">₹${(summary?.monthRevenue ?? 0).toLocaleString('en-IN')}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Pending Dues</div>
                  <div class="kpi-val" style="color: #DC2626;">₹${(summary?.totalPendingDues ?? 0).toLocaleString('en-IN')}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Active Members</div>
                  <div class="kpi-val">${summary?.activeMembers ?? 0} / ${summary?.totalMembers ?? 0}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Retention Health</div>
                  <div class="kpi-val" style="color: #10B981;">${summary?.retentionRate ?? 0}%</div>
                </div>
              </div>

              <div class="section-title">MEMBERSHIP PLAN REVENUE BREAKDOWN</div>
              <table>
                <thead>
                  <tr>
                    <th>PLAN NAME</th>
                    <th>PRICE</th>
                    <th>ACTIVE SUBSCRIBERS</th>
                    <th>TOTAL REVENUE</th>
                  </tr>
                </thead>
                <tbody>
                  ${plans.map((p: any) => `
                    <tr>
                      <td><b>${p.name}</b></td>
                      <td>₹${Number(p.price).toLocaleString('en-IN')}</td>
                      <td>${p.activeMembers} members</td>
                      <td><b>₹${Number(p.totalRevenue).toLocaleString('en-IN')}</b></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="section-title">HISTORICAL REVENUE & SIGNUP TRENDS</div>
              <table>
                <thead>
                  <tr>
                    <th>PERIOD</th>
                    <th>REVENUE COLLECTED</th>
                    <th>NEW SIGNUPS</th>
                    <th>CHECK-IN VISITS</th>
                  </tr>
                </thead>
                <tbody>
                  ${trends.map((t: any) => `
                    <tr>
                      <td><b>${t.label}</b></td>
                      <td>₹${Number(t.revenue).toLocaleString('en-IN')}</td>
                      <td>${t.newMembers} members</td>
                      <td>${t.attendance} visits</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="footer">Confidential · GYMENT Gym Operations & Management Platform</div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        message.success('Print window opened for PDF export');
        return;
      }

      if (type === 'excel') {
        // Generates Excel-compatible CSV with UTF-8 BOM
        let csv = '\uFEFF';
        csv += 'GYMENT GYM PERFORMANCE & FINANCIAL AUDIT REPORT\n';
        csv += `Generated On,${new Date().toLocaleString()}\n`;
        csv += `Date Filter,${dateFilter}\n\n`;

        csv += 'EXECUTIVE FINANCIAL SUMMARY\n';
        csv += `This Month Revenue,Rs. ${summary?.monthRevenue ?? 0}\n`;
        csv += `Lifetime Revenue,Rs. ${summary?.totalLifetimeRevenue ?? 0}\n`;
        csv += `Pending Dues,Rs. ${summary?.totalPendingDues ?? 0}\n`;
        csv += `Total Registered Members,${summary?.totalMembers ?? 0}\n`;
        csv += `Active Members,${summary?.activeMembers ?? 0}\n`;
        csv += `Retention Health,${summary?.retentionRate ?? 0}%\n`;
        csv += `Average Daily Footfall,${summary?.avgDailyAttendance ?? 0} visits/day\n\n`;

        csv += 'MEMBERSHIP PLAN PERFORMANCE\n';
        csv += 'Plan Name,Price,Active Members,Total Revenue\n';
        plans.forEach((p: any) => {
          csv += `"${p.name}",${p.price},${p.activeMembers},${p.totalRevenue}\n`;
        });
        csv += '\n';

        csv += 'HISTORICAL MONTHLY TRENDS\n';
        csv += 'Month,Revenue (Rs.),New Signups,Attendance Visits\n';
        trends.forEach((t: any) => {
          csv += `"${t.label}",${t.revenue},${t.newMembers},${t.attendance}\n`;
        });

        const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Gyment_Report_${dateFilter}_${dayjs().format('YYYY-MM-DD')}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        message.success('Excel report downloaded successfully');
      }
    } catch (e) {
      console.error('Export error:', e);
      message.error('Failed to export report');
    }
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'pdf',
      label: (
        <div className="flex items-center gap-2.5 py-1">
          <FileText className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-xs">Export PDF</span>
        </div>
      ),
      onClick: () => handleExport('pdf'),
    },
    {
      key: 'excel',
      label: (
        <div className="flex items-center gap-2.5 py-1">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-xs">Export Excel</span>
        </div>
      ),
      onClick: () => handleExport('excel'),
    },
  ];

  const dateFilterOptions = [
    { value: '30d', label: 'Last 30 Days' },
    { value: 'last_month', label: 'Last Month' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Past 1 Year' },
    { value: 'custom', label: 'Custom Date Range' },
  ];

  // Topbar custom action slot
  const topbarActions = (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Date Filter Dropdown */}
      <div className="flex items-center gap-1.5">
        <Select
          value={dateFilter}
          onChange={(val) => {
            setDateFilter(val);
            if (val !== 'custom') {
              setCustomRange(null);
            }
          }}
          options={dateFilterOptions}
          className="w-40 sm:w-44 text-xs font-semibold"
          suffixIcon={<Calendar className="w-3.5 h-3.5 text-muted pointer-events-none" />}
          size="middle"
        />

        {/* Custom Date Range Picker when selected */}
        {dateFilter === 'custom' && (
          <RangePicker
            value={customRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setCustomRange([dates[0], dates[1]]);
              } else {
                setCustomRange(null);
              }
            }}
            format="DD MMM YYYY"
            className="w-56 text-xs"
            size="middle"
          />
        )}
      </div>

      {/* Export Dropdown Button */}
      <Dropdown menu={{ items: exportMenuItems }} trigger={['click']} placement="bottomRight">
        <button
          type="button"
          className="bg-primary hover:bg-primary-dark text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5 stroke-2" />
          <span>Export</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>
      </Dropdown>

      {/* Refresh Trigger */}
      <button
        type="button"
        onClick={fetchReportsData}
        title="Refresh Analytics"
        disabled={isLoading}
        className="p-2 border border-gyment-border bg-white hover:bg-gyment-bg text-muted hover:text-gyment-text rounded-lg transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );

  return (
    <>
      <GymAdminTopbar
        title="Reports & Analytics"
        subtitle="Executive-level financial health, member retention, footfall trends, and revenue insights."
        actions={topbarActions}
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-6">
        {/* 1. Executive Owner Financial Health Strips */}
        <MotionFadeIn delay={0.04}>
          <OwnerFinancialHealthBar summary={reportData?.summary || null} />
        </MotionFadeIn>

        {/* 2. Revenue Collections & Member Signups Dual-Axis Chart */}
        <MotionFadeIn delay={0.1}>
          <RevenueAndGrowthChart monthlyTrends={reportData?.monthlyTrends || []} />
        </MotionFadeIn>

        {/* 3. Plan Distribution & Performance Table */}
        <MotionFadeIn delay={0.16}>
          <PlanDistributionReportCard planDistribution={reportData?.planDistribution || []} />
        </MotionFadeIn>

        {/* 4. Peak Operations & Payment Instrument Preferences */}
        <MotionFadeIn delay={0.22}>
          <OperationsAndMethodsCard
            hourlyPeak={reportData?.hourlyPeakReport || []}
            paymentMethods={reportData?.paymentsByMethod || []}
          />
        </MotionFadeIn>
      </main>
    </>
  );
}
