'use client';

import React, { useEffect } from 'react';
import { GymAdminProvider } from '@/context/GymAdminContext';
import { GymAdminSidebar } from '@/components/gym-admin/layout/GymAdminSidebar';
import { GymAdminBottomNav } from '@/components/gym-admin/layout/GymAdminBottomNav';
import { ComparePlansModal } from '@/components/gym-admin/shared/ComparePlansModal';

export function GymAdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.title = 'GYMENT — Owner Dashboard';
  }, []);

  return (
    <GymAdminProvider>
      <div className="flex min-h-screen bg-gyment-bg text-gyment-text">
        {/* Sidebar */}
        <GymAdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {children}

          <GymAdminBottomNav />
        </div>

        {/* Global Modals */}
        <ComparePlansModal />
      </div>
    </GymAdminProvider>
  );
}
