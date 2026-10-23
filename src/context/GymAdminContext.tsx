'use client';

import React, { createContext, useContext, useState } from 'react';
import { GymAdminContextType } from '@/types/gymAdminContext';
import { GymentPlanTier, GymFeatureName } from '@/types/gymAdmin';
import { hasPlanFeature } from '@/utils/gymAdminHelpers';

const GymAdminContext = createContext<GymAdminContextType | undefined>(undefined);

export const GymAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [planTier, setPlanTier] = useState<GymentPlanTier>('growth');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const openCompareModal = () => setIsCompareModalOpen(true);
  const closeCompareModal = () => setIsCompareModalOpen(false);
  const hasFeature = (feature: GymFeatureName) => hasPlanFeature(planTier, feature);

  return (
    <GymAdminContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        isSidebarCollapsed: sidebarCollapsed,
        isMobileSidebarOpen: mobileSidebarOpen,
        selectedBranch,
        setSelectedBranch,
        planTier,
        setPlanTier,
        hasFeature,
        isCompareModalOpen,
        openCompareModal,
        closeCompareModal,
      }}
    >
      {children}
    </GymAdminContext.Provider>
  );
};

export const useGymAdmin = () => {
  const context = useContext(GymAdminContext);
  if (!context) {
    throw new Error('useGymAdmin must be used within a GymAdminProvider');
  }
  return context;
};
