'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { App } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { initials } from '@/lib/formatters';
import { ActivityItem } from '@/types/activity';

export default function GymDetailPage({
  params,
}: {
  params: Promise<{ gymId: string }>;
}) {
  const { message } = App.useApp();
  const { gymId } = use(params);
  const router = useRouter();
  const {
    gyms,
    users,
    toggleGymStatus,
    openConfirmModal,
    openUserDrawer,
  } = useSuperAdmin();

  const id = Number(gymId);
  const gym = gyms.find(g => g.id === id);

  if (!gym) {
    return (
      <>
        <Topbar title="Gym Not Found" subtitle="Requested gym profile does not exist." />
        <main className="p-4 sm:p-5 w-full mx-auto">
          <div className="p-8 text-center bg-white border border-gyment-border rounded-[14px]">
            <h2 className="text-[16px] font-bold text-gyment-text mb-2">Gym Not Found</h2>
            <p className="text-[13px] text-gyment-muted mb-4">
              The gym with ID {gymId} does not exist or has been removed.
            </p>
            <Link
              href="/super-admin/gyms"
              className="text-primary-dark font-bold text-[13px] hover:underline"
            >
              ← Return to Gyms
            </Link>
          </div>
        </main>
      </>
    );
  }

  const matchedUser = users.find(u => u.name === gym.owner);

  const handleToggleStatus = () => {
    const isSuspended = gym.gymStatus === 'Suspended';
    openConfirmModal({
      title: isSuspended ? 'Activate this gym?' : 'Suspend this gym?',
      body: isSuspended
        ? 'Are you sure you want to reactivate this gym?'
        : 'Are you sure you want to suspend this gym? Owners and staff will lose access.',
      actionLabel: isSuspended ? 'Activate Gym' : 'Suspend Gym',
      isDanger: !isSuspended,
      onConfirm: () => {
        toggleGymStatus(gym.id);
        message.success(
          isSuspended ? 'Gym activated successfully' : 'Gym suspended successfully'
        );
      },
    });
  };

  const gymActivities: ActivityItem[] = [
    {
      id: 1,
      t: 'Member added',
      d: `A new member was added to ${gym.name}.`,
      ti: 'Today',
      icon: 'USERS',
      tone: 'green',
    },
    {
      id: 2,
      t: 'Payment recorded',
      d: 'A membership payment was recorded.',
      ti: 'Yesterday',
      icon: 'REVENUE',
      tone: 'blue',
    },
    {
      id: 3,
      t: 'Login activity',
      d: `${gym.owner} logged in to the owner dashboard.`,
      ti: gym.lastLogin,
      icon: 'LOGIN',
      tone: 'blue',
    },
    {
      id: 4,
      t: 'Subscription changed',
      d: `Plan set to ${gym.plan}.`,
      ti: gym.joined,
      icon: 'UPGRADE',
      tone: 'amber',
    },
  ];

  return (
    <>
      <Topbar
        title="Gym Details"
        subtitle="Full profile for a registered gym."
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* Back Link */}
        <MotionFadeIn delay={0.02}>
          <Link
            href="/super-admin/gyms"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-gyment-muted hover:text-gyment-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Gyms</span>
          </Link>
        </MotionFadeIn>

        {/* Main Gym Header Card */}
        <MotionFadeIn delay={0.05} className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5 flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-xl bg-primary-light text-primary-dark flex items-center justify-center font-extrabold text-[18px] shrink-0">
              {initials(gym.name)}
            </div>
            <div>
              <div className="text-lg font-extrabold text-gyment-text">{gym.name}</div>
              <div className="text-[12.5px] text-gyment-muted mt-0.5">Owned by {gym.owner}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge variant="info">{gym.plan} Plan</StatusBadge>
                <StatusBadge status={gym.gymStatus} />
                <span className="text-[11.5px] text-gyment-muted">Registered {gym.joined}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/super-admin/subscriptions')}
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text transition-colors"
            >
              View Subscription
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`px-3.5 py-2 rounded-[9px] text-[13px] font-semibold transition-colors border ${gym.gymStatus === 'Suspended'
                ? 'bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark border-primary transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer'
                : 'bg-danger-light hover:bg-danger text-danger hover:text-white border-danger-light'
                }`}
            >
              {gym.gymStatus === 'Suspended' ? 'Activate Gym' : 'Suspend Gym'}
            </button>
          </div>
        </MotionFadeIn>

        {/* Overview Section */}
        <MotionFadeIn delay={0.1}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Overview</h2>
          </div>
          <MotionStagger className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MotionItem><StatCard label="Total Members" value={gym.members} /></MotionItem>
            <MotionItem><StatCard label="Active Members" value={gym.activeMembers} /></MotionItem>
            <MotionItem><StatCard label="Staff" value={gym.staff} /></MotionItem>
            <MotionItem><StatCard label="Trainers" value={gym.trainers} /></MotionItem>
          </MotionStagger>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2.5">
            <StatCard label="Branches" value={gym.branches} />
            <StatCard label="Current Plan" value={gym.plan} />
            <div className="bg-white border border-gyment-border rounded-xl px-4 py-3.5">
              <div className="text-[11.5px] text-gyment-muted font-semibold">
                Subscription Status
              </div>
              <div className="mt-1.5">
                <StatusBadge status={gym.subStatus} />
              </div>
            </div>
            <StatCard label="Next Billing Date" value={gym.nextBilling} />
          </div>
        </MotionFadeIn>

        {/* Gym Owner Section */}
        <MotionFadeIn delay={0.15}>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Gym Owner</h2>
              <p className="text-[12px] text-gyment-muted m-0">Contact details on file</p>
            </div>
          </div>
          <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <div className="space-y-0.5 text-[13px]">
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Owner Name</span>
                <span className="font-semibold text-gyment-text">{gym.owner}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Email</span>
                <span className="font-semibold text-gyment-text">{gym.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Phone</span>
                <span className="font-semibold text-gyment-text">{gym.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Account Created</span>
                <span className="font-semibold text-gyment-text">{gym.created}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Last Login</span>
                <span className="font-semibold text-gyment-text">{gym.lastLogin}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border items-center">
                <span className="text-gyment-muted">Account Status</span>
                <StatusBadge variant="ok">Active</StatusBadge>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-4 pt-2">
              {matchedUser && (
                <button
                  type="button"
                  onClick={() => openUserDrawer(matchedUser.id)}
                  className="border border-gyment-border bg-white hover:bg-gyment-bg px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gyment-text transition-colors"
                >
                  View User
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:${gym.email}`;
                }}
                className="border border-gyment-border bg-white hover:bg-gyment-bg px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gyment-text transition-colors"
              >
                Contact Owner
              </button>
              <button
                type="button"
                onClick={() => message.info('Owner account status updated')}
                className="border border-danger-light bg-danger-light text-danger hover:bg-danger hover:text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
              >
                Disable Account
              </button>
            </div>
          </div>
        </MotionFadeIn>

        {/* Gym Activity Section */}
        <MotionFadeIn delay={0.2}>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Gym Activity</h2>
              <p className="text-[12px] text-gyment-muted m-0">High-level activity log</p>
            </div>
          </div>
          <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <Timeline items={gymActivities} />
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
