import React from 'react';
import { useGymAdmin } from '@/context/GymAdminContext';
import { LockedCard } from '@/components/gym-admin/shared/LockedCard';
import { GymSvgLineChart } from '@/components/gym-admin/shared/GymSvgLineChart';
import { GymGrowthPoint, GymAdminDashboardStats } from '@/types/gymAdmin';

interface GymAdvancedAnalyticsProps {
  stats: GymAdminDashboardStats | null;
  growthTrend: GymGrowthPoint[];
}

export const GymAdvancedAnalytics: React.FC<GymAdvancedAnalyticsProps> = ({
  stats,
  growthTrend,
}) => {
  const { hasFeature } = useGymAdmin();
  const isEnabled = hasFeature('Advanced Dashboard & Analytics');

  if (!isEnabled) {
    return (
      <LockedCard
        title="Advanced Dashboard & Analytics"
        planRequired="Growth"
        description="Upgrade your plan to unlock deep membership breakdowns, trend analysis, and monthly retention charts."
      />
    );
  }

  const active = stats?.activeMembers ?? 0;
  const expiring = stats?.expiringSoon ?? 0;
  const expired = stats?.expired ?? 0;
  const total = Math.max(stats?.totalMembers ?? 1, 1);
  const inactive = Math.max(total - active - expiring - expired, 0);

  const statuses = [
    { label: 'Active', count: active, color: '#2FAE68' },
    { label: 'Expiring Soon', count: expiring, color: '#C98A1F' },
    { label: 'Expired', count: expired, color: '#C5432E' },
    { label: 'Inactive', count: inactive, color: '#8FA098' },
  ];

  const maxVal = Math.max(...statuses.map((s) => s.count), 1);

  const growthValues = growthTrend.map((g) => g.count);
  const growthLabels = growthTrend.map((g) => g.month);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Membership Status Breakdown */}
      <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gyment-text">
            Membership Status Breakdown
          </h3>
          <span className="text-xs text-gyment-muted font-medium">
            By count
          </span>
        </div>

        <div className="space-y-3.5 mt-2">
          {statuses.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gyment-muted font-medium">
                  {item.label}
                </span>
                <span className="font-extrabold text-gyment-text">
                  {item.count}
                </span>
              </div>
              <div className="h-2 w-full bg-gyment-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(item.count / maxVal) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Growth Trend */}
      <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gyment-text">
            Member Growth
          </h3>
          <span className="text-xs text-gyment-muted font-medium">
            Last 6 months
          </span>
        </div>

        <GymSvgLineChart
          data={growthValues}
          labels={growthLabels}
          color="#22935A"
          height={160}
        />
      </div>
    </div>
  );
};
