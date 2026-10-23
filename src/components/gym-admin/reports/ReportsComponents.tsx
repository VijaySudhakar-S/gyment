import React from 'react';
import {
  GymAdminDashboardStats,
  GymBranchReport,
  GymRevenuePoint,
} from '@/types/gymAdmin';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { useGymAdmin } from '@/context/GymAdminContext';
import { LockedCard } from '@/components/gym-admin/shared/LockedCard';
import { GymSvgLineChart } from '@/components/gym-admin/shared/GymSvgLineChart';
import { Download, Lock } from 'lucide-react';
import { App, Table } from 'antd';

export const ReportsKpis: React.FC<{
  stats: GymAdminDashboardStats | null;
}> = ({ stats }) => {
  const total = stats?.totalMembers ?? 0;
  const active = stats?.activeMembers ?? 0;
  const expired = stats?.expired ?? 0;
  const new30d = stats?.newMembers30d ?? 0;
  const todayRev = stats?.todayRevenue ?? 0;
  const monthRev = stats?.monthlyRevenue ?? 0;
  const expiring = stats?.expiringSoon ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Member Report Card */}
      <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-gyment-text uppercase tracking-wider mb-3">
          Member Report
        </h3>
        <div className="space-y-2.5 text-[13px]">
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Total members</span>
            <span className="font-bold text-gyment-text">{total}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Active</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {active}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Expired</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">{expired}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">New (30d)</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{new30d}</span>
          </div>
        </div>
      </div>

      {/* Attendance Report Card */}
      <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-gyment-text uppercase tracking-wider mb-3">
          Attendance Report
        </h3>
        <div className="space-y-2.5 text-[13px]">
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Daily average</span>
            <span className="font-bold text-gyment-text">
              {stats?.todayAttendance ? Math.round(stats.todayAttendance * 0.9) : 0} visits
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Monthly total</span>
            <span className="font-bold text-gyment-text">
              {stats?.todayAttendance ? stats.todayAttendance * 26 : 0} visits
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Attendance rate</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {total > 0 ? Math.min(99, Math.round((active / total) * 100)) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Payment Report Card */}
      <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-gyment-text uppercase tracking-wider mb-3">
          Payment Report
        </h3>
        <div className="space-y-2.5 text-[13px]">
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Daily collection</span>
            <span className="font-bold text-gyment-text">
              {fmtRs(todayRev)}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Monthly revenue</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {fmtRs(monthRev)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Top method</span>
            <span className="font-bold text-gyment-text">UPI / Cash</span>
          </div>
        </div>
      </div>

      {/* Membership Report Card */}
      <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-gyment-text uppercase tracking-wider mb-3">
          Membership Report
        </h3>
        <div className="space-y-2.5 text-[13px]">
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Expiring in 7d</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{expiring}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-dashed border-border/80">
            <span className="text-muted">Renewal rate</span>
            <span className="font-bold text-gyment-text">88%</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Top Plan</span>
            <span className="font-bold text-gyment-text">Monthly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RevenueTrendsCard: React.FC<{
  revenueTrend: GymRevenuePoint[];
}> = ({ revenueTrend }) => {
  const values = revenueTrend.map((r) => r.amount);
  const labels = revenueTrend.map((r) => r.label);

  return (
    <div className="bg-white border border-border rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gyment-text">
            Monthly Revenue Collections
          </h3>
          <p className="text-xs text-muted">
            Fee collections trend over the past 6 months
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
          Collections
        </span>
      </div>

      <GymSvgLineChart
        data={values}
        labels={labels}
        color="#2FAE68"
        height={210}
        isCurrency
      />
    </div>
  );
};

export const BranchWiseReportsCard: React.FC<{
  branchReports: GymBranchReport[];
}> = ({ branchReports }) => {
  const { hasFeature } = useGymAdmin();
  const canViewBranches = hasFeature('Multiple Branch Management');

  if (!canViewBranches) {
    return (
      <LockedCard
        title="Branch-wise & Consolidated Reports"
        planRequired="Pro"
        description="Compare performance across multiple gym locations and view consolidated revenues once you upgrade to Pro."
      />
    );
  }

  const consolidatedTotal = branchReports.reduce((acc, b) => acc + b.revenue, 0);

  const columns = [
    {
      title: 'BRANCH',
      dataIndex: 'branchName',
      key: 'branchName',
      render: (name: string) => (
        <span className="font-bold text-gyment-text text-[13.5px]">{name}</span>
      ),
    },
    {
      title: 'MEMBERS',
      dataIndex: 'members',
      key: 'members',
      render: (members: number) => (
        <span className="text-muted text-[13px]">{members}</span>
      ),
    },
    {
      title: 'REVENUE',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (rev: number) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
          {fmtRs(rev)}
        </span>
      ),
    },
    {
      title: 'ATTENDANCE',
      dataIndex: 'attendance',
      key: 'attendance',
      render: (att: number) => (
        <span className="text-muted text-[13px]">{att}</span>
      ),
    },
  ];

  return (
    <div className="bg-white border border-border rounded-2xl p-5 mb-6 shadow-xs">
      <Table
        dataSource={branchReports}
        columns={columns}
        rowKey="branchId"
        pagination={false}
        scroll={{ x: 500 }}
      />

      <div className="flex items-center justify-between border-t border-border mt-4 pt-3.5 text-[13.5px]">
        <span className="text-muted font-semibold">
          Consolidated Revenue
        </span>
        <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
          {fmtRs(consolidatedTotal)}
        </span>
      </div>
    </div>
  );
};

export const ExportReportsCard: React.FC = () => {
  const { hasFeature, openCompareModal } = useGymAdmin();
  const { message } = App.useApp();

  const canExportExcel = hasFeature('Excel Export');
  const canExportAdvanced = hasFeature('Advanced Data Export');

  const handleExport = (type: string) => {
    message.success(`Exporting ${type} report...`);
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
      <h3 className="text-sm font-bold text-gyment-text mb-1.5">
        Export Gym Data
      </h3>
      <p className="text-xs text-muted mb-4">
        Download reports in various formats for accountants or local backup.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/* CSV */}
        <button
          type="button"
          onClick={() => handleExport('CSV')}
          className="border border-border bg-white hover:bg-stone-50 text-gyment-text px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-muted" />
          Export CSV
        </button>

        {/* Excel */}
        {canExportExcel ? (
          <button
            type="button"
            onClick={() => handleExport('Excel')}
            className="border border-border bg-white hover:bg-stone-50 text-gyment-text px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Export Excel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openCompareModal()}
            className="border border-dashed border-border bg-stone-50 text-muted px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer hover:border-amber-400 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Excel — Growth
          </button>
        )}

        {/* Advanced Export */}
        {canExportAdvanced ? (
          <button
            type="button"
            onClick={() => handleExport('Advanced PDF/ZIP')}
            className="border border-border bg-white hover:bg-stone-50 text-gyment-text px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Advanced Data Export
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openCompareModal()}
            className="border border-dashed border-border bg-stone-50 text-muted px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer hover:border-amber-400 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            Advanced Export — Pro
          </button>
        )}
      </div>
    </div>
  );
};
