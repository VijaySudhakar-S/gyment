import React from 'react';
import { GymentPlanTier, GymFeatureName } from '@/types/gymAdmin';

export interface GymAdminContextType {
  // Sidebar UI state (matching SuperAdmin structure)
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Compatibility aliases
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;

  // Selected branch filter
  selectedBranch: string;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string>>;

  // Plan tier & dynamic feature permissions
  planTier: GymentPlanTier;
  setPlanTier: React.Dispatch<React.SetStateAction<GymentPlanTier>>;
  planName: string;
  price: number;
  yearlyPrice: number;
  billingCycle: string;
  renewalDate: string;
  membersText: string;
  staffLimitText: string;
  dynamicFeatures: Record<string, boolean>;
  featureLimits: Record<string, string>;
  availablePlans: any[];
  hasFeature: (feature: GymFeatureName) => boolean;
  refreshSubscription: () => Promise<void>;

  // Plan comparison modal UI state
  isCompareModalOpen: boolean;
  openCompareModal: () => void;
  closeCompareModal: () => void;
}

