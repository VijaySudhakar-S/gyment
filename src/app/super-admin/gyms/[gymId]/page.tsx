'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { App } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { initials } from '@/lib/formatters';
import { gymsApi, GymData } from '@/lib/api/superadmin/gyms.api';
import { GymDetailSkeleton } from '@/components/shared/skeletons';

export default function GymDetailPage({
  params,
}: {
  params: Promise<{ gymId: string }>;
}) {
  const { message, modal } = App.useApp();
  const { gymId } = use(params);
  const router = useRouter();

  const [gym, setGym] = useState<GymData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchGym = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await gymsApi.getById(gymId);
      if (res.status && res.data) {
        setGym(res.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load gym details');
    } finally {
      setIsLoading(false);
    }
  }, [gymId, message]);

  useEffect(() => {
    fetchGym();
  }, [fetchGym]);

  if (isLoading) {
    return (
      <>
        <Topbar title="Loading Gym..." subtitle="Fetching gym profile and records..." />
        <main className="p-4 sm:p-5 w-full mx-auto">
          <GymDetailSkeleton />
        </main>
      </>
    );
  }

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

  const handleToggleStatus = () => {
    const isSuspended = gym.status === 'SUSPENDED';
    modal.confirm({
      title: isSuspended ? 'Activate this gym?' : 'Suspend this gym?',
      content: isSuspended
        ? `Are you sure you want to reactivate ${gym.name}?`
        : `Are you sure you want to suspend ${gym.name}? Owners and staff will lose access.`,
      okText: isSuspended ? 'Activate Gym' : 'Suspend Gym',
      okType: !isSuspended ? 'danger' : 'primary',
      centered : true,
      onOk: async () => {
        try {
          const res = await gymsApi.toggleStatus(gym.id);
          if (res.status) {
            message.success(isSuspended ? 'Gym activated successfully' : 'Gym suspended successfully');
            await fetchGym();
          }
        } catch (error: any) {
          message.error(error.message || 'Failed to toggle gym status');
        }
      },
    });
  };

  const adminUser = gym.primaryAdmin;
  const activeSub = gym.activeSubscription;

  return (
    <>
      <Topbar
        title="Gym Details"
        subtitle="Full profile for a registered facility."
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
              <div className="text-[12.5px] text-gyment-muted mt-0.5">Code: {gym.code} • Schema: {gym.schemaName}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {activeSub && (
                  <StatusBadge variant="info">{activeSub.planName} Plan</StatusBadge>
                )}
                <StatusBadge status={gym.status} />
                <span className="text-[11.5px] text-gyment-muted">Registered {new Date(gym.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/super-admin/subscriptions')}
              className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text transition-colors cursor-pointer"
            >
              View Subscription
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`px-3.5 py-2 rounded-[9px] text-[13px] font-semibold transition-colors border cursor-pointer ${gym.status === 'SUSPENDED'
                ? 'bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark border-primary'
                : 'bg-danger-light hover:bg-danger text-danger hover:text-white border-danger-light'
                }`}
            >
              {gym.status === 'SUSPENDED' ? 'Activate Gym' : 'Suspend Gym'}
            </button>
          </div>
        </MotionFadeIn>

        {/* Overview Section */}
        <MotionFadeIn delay={0.1}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Subscription & Facility Overview</h2>
          </div>
          <MotionStagger className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MotionItem><StatCard label="Location" value={gym.location || '-'} /></MotionItem>
            <MotionItem><StatCard label="Current Plan" value={activeSub?.planName || 'None'} /></MotionItem>
            <MotionItem><StatCard label="Billing Cycle" value={activeSub?.billingCycle || '-'} /></MotionItem>
            <MotionItem><StatCard label="Renewal Date" value={activeSub ? new Date(activeSub.renewalDate).toLocaleDateString() : '-'} /></MotionItem>
          </MotionStagger>
        </MotionFadeIn>

        {/* Gym Owner & Contact Section */}
        <MotionFadeIn delay={0.15}>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Owner & Primary Contact</h2>
              <p className="text-[12px] text-gyment-muted m-0">Contact details on file</p>
            </div>
          </div>
          <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <div className="space-y-0.5 text-[13px]">
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Primary Admin / Owner</span>
                <span className="font-semibold text-gyment-text">{gym.ownerName || adminUser?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Contact Email</span>
                <span className="font-semibold text-gyment-text">{gym.contactEmail || adminUser?.email || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Contact Phone</span>
                <span className="font-semibold text-gyment-text">{gym.contactPhone || adminUser?.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Address</span>
                <span className="font-semibold text-gyment-text">
                  {[gym.address, gym.city, gym.state, gym.pincode].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border">
                <span className="text-gyment-muted">Account Registered</span>
                <span className="font-semibold text-gyment-text">{new Date(gym.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-gyment-border items-center">
                <span className="text-gyment-muted">Status</span>
                <StatusBadge status={gym.status} />
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-4 pt-2">
              {(gym.contactEmail || adminUser?.email) && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `mailto:${gym.contactEmail || adminUser?.email}`;
                  }}
                  className="border border-gyment-border bg-white hover:bg-gyment-bg px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gyment-text transition-colors cursor-pointer"
                >
                  Contact Owner
                </button>
              )}
            </div>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
