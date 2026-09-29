'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { SubscriptionDonutChart } from '@/components/charts/SubscriptionDonutChart';
import { initials } from '@/lib/formatters';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';

export default function DashboardPage() {
  const router = useRouter();
  const { gyms, activity, setAddGymModalOpen } = useSuperAdmin();

  const totalGyms = gyms.length;
  const activeGyms = gyms.filter(g => g.gymStatus === 'Active').length;
  const trialGyms = gyms.filter(g => g.gymStatus === 'Trial').length;
  const suspendedGyms = gyms.filter(g => g.gymStatus === 'Suspended').length;
  const totalMembers = gyms.reduce((s, g) => s + g.members, 0);
  const activeSubs = gyms.filter(g => g.subStatus === 'Active').length;
  const expiringSubs = 3;

  const recentGyms = [...gyms].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Monitor and manage the GYMENT platform from one place."
        actions={
          <button
            type="button"
            onClick={() => setAddGymModalOpen(true)}
            className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-2" />
            <span className="hidden sm:inline">Add Gym</span>
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* Primary KPI Row */}
        <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MotionItem><StatCard label="Total Gyms" value={totalGyms} delta="+2 this week" deltaType="up" /></MotionItem>
          <MotionItem><StatCard label="Active Gyms" value={activeGyms} delta="+1 this week" deltaType="up" /></MotionItem>
          <MotionItem><StatCard label="Trial Gyms" value={trialGyms} delta="Converting soon" deltaType="up" /></MotionItem>
          <MotionItem><StatCard
            label="Suspended Gyms"
            value={suspendedGyms}
            delta="Needs review"
            deltaType="down"
          /></MotionItem>
          <MotionItem><StatCard
            label="Total Members (Platform)"
            value={totalMembers.toLocaleString('en-IN')}
            delta="Across all gyms"
            deltaType="up"
          /></MotionItem>
          <MotionItem><StatCard
            label="Monthly Recurring Revenue"
            value="₹16.9L"
            delta="+9% vs last month"
            deltaType="up"
          /></MotionItem>
          <MotionItem><StatCard
            label="Active Subscriptions"
            value={activeSubs}
            delta="Billing normally"
            deltaType="up"
          /></MotionItem>
          <MotionItem><StatCard
            label="Expiring Subscriptions"
            value={expiringSubs}
            delta="Within 7 days"
            deltaType="down"
          /></MotionItem>
        </MotionStagger>

        {/* Charts Section */}
        <MotionFadeIn delay={0.12}>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-gyment-text m-0">Platform Revenue</h2>
              <p className="text-xs text-gyment-muted m-0">Sample data for demonstration only</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Revenue Chart Card */}
            <div className="lg:col-span-7 bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-sm font-bold text-gyment-text m-0">
                  Monthly Platform Revenue
                </h3>
                <span className="text-xs text-gyment-muted">Jan – Sep (demo)</span>
              </div>
              <RevenueChart />
            </div>

            {/* Subscription Distribution Card */}
            <div className="lg:col-span-5 bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-sm font-bold text-gyment-text m-0">
                  Subscription Distribution
                </h3>
                <span className="text-xs text-gyment-muted">By plan</span>
              </div>
              <SubscriptionDonutChart />
            </div>
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
            <StatCard
              label="Current Month Revenue"
              value="₹18.6L"
              delta="+9% vs last month"
              deltaType="up"
            />
            <StatCard
              label="Previous Month Revenue"
              value="₹17.1L"
              delta="Sample data"
              deltaType="neu"
            />
            <StatCard
              label="Year-to-Date Revenue"
              value="₹1.42Cr"
              delta="Jan – Sep"
              deltaType="up"
            />
            <StatCard
              label="Recurring Revenue"
              value="₹16.9L"
              delta="MRR, demo"
              deltaType="up"
            />
          </div>
        </MotionFadeIn>

        {/* Recent Activity */}
        <MotionFadeIn delay={0.2}>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-gyment-text m-0">Recent Activity</h2>
              <p className="text-xs text-gyment-muted m-0">Platform-wide events</p>
            </div>
          </div>
          <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <Timeline items={activity} />
          </div>
        </MotionFadeIn>

        {/* New Gym Registrations Table */}
        <MotionFadeIn delay={0.26}>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-gyment-text m-0">
                New Gym Registrations
              </h2>
              <p className="text-xs text-gyment-muted m-0">Recently onboarded gyms</p>
            </div>
          </div>

          <div className="bg-white border border-gyment-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs sm:text-[13px]">
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
                      Members
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                      Registered
                    </th>
                    <th className="px-3 py-2.5 border-b border-gyment-border"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gyment-border">
                  {recentGyms.map(gym => (
                    <tr key={gym.id} className="hover:bg-gyment-bg transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-xs shrink-0">
                            {initials(gym.name)}
                          </div>
                          <div className="font-bold text-gyment-text">{gym.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.owner}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.plan}</td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.members}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={gym.gymStatus} />
                      </td>
                      <td className="px-3 py-2.5 text-gyment-text">{gym.joined}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => router.push(`/super-admin/gyms/${gym.id}`)}
                          className="border border-gyment-border bg-white hover:bg-gyment-bg px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gyment-text transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
