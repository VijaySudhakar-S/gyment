'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GymAdminContextType } from '@/types/gymAdminContext';
import { GymentPlanTier, GymFeatureName } from '@/types/gymAdmin';
import { hasPlanFeature } from '@/utils/gymAdminHelpers';
import { subscriptionApi } from '@/lib/api/gymadmin/settings.api';

const GymAdminContext = createContext<GymAdminContextType | undefined>(undefined);

export const GymAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [gymName, setGymNameState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('gyment_user') || '{}');
        return u.gymName || u.gym?.name || 'Gyment Gym';
      } catch {
        return 'Gyment Gym';
      }
    }
    return 'Gyment Gym';
  });

  const setGymName = (name: string) => {
    setGymNameState(name);
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('gyment_user');
        const userObj = raw ? JSON.parse(raw) : {};
        userObj.gymName = name;
        if (userObj.gym) userObj.gym.name = name;
        localStorage.setItem('gyment_user', JSON.stringify(userObj));
      } catch (err) {
        console.error('Failed to sync gym name to storage:', err);
      }
    }
  };

  const [planTier, setPlanTier] = useState<GymentPlanTier>('pro');
  const [planName, setPlanName] = useState<string>('Pro');
  const [price, setPrice] = useState<number>(0);
  const [yearlyPrice, setYearlyPrice] = useState<number>(0);
  const [billingCycle, setBillingCycle] = useState<string>('Monthly');
  const [renewalDate, setRenewalDate] = useState<string>('');
  const [membersText, setMembersText] = useState<string>('Unlimited members');
  const [staffLimitText, setStaffLimitText] = useState<string>('Unlimited staff accounts');
  const [dynamicFeatures, setDynamicFeatures] = useState<Record<string, boolean>>({});
  const [featureLimits, setFeatureLimits] = useState<Record<string, string>>({});
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  const refreshSubscription = useCallback(async () => {
    try {
      const res = await subscriptionApi.getSubscriptionInfo();
      if (res?.status && res?.data) {
        const sub = res.data.subscription;
        if (sub) {
          setPlanTier(sub.planTier || 'pro');
          setPlanName(sub.planName || 'Pro');
          setPrice(Number(sub.price || 0));
          setYearlyPrice(Number(sub.yearlyPrice || 0));
          setBillingCycle(sub.billingCycle || 'Monthly');
          setRenewalDate(sub.renewalDate || '');
          setMembersText(sub.membersText || 'Unlimited members');
          setStaffLimitText(sub.staffLimitText || 'Unlimited staff accounts');
          if (sub.enabledFeatures && typeof sub.enabledFeatures === 'object') {
            setDynamicFeatures(sub.enabledFeatures);
          }
          if (sub.limits && typeof sub.limits === 'object') {
            setFeatureLimits(sub.limits);
          }
        }
        if (Array.isArray(res.data.availablePlans)) {
          setAvailablePlans(res.data.availablePlans);
        }
      }
    } catch (err) {
      console.error('Failed to load subscription info in GymAdminContext:', err);
    }
  }, []);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const openCompareModal = () => setIsCompareModalOpen(true);
  const closeCompareModal = () => setIsCompareModalOpen(false);

  const hasFeature = (feature: GymFeatureName) => {
    return hasPlanFeature(planTier, feature, dynamicFeatures);
  };

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
        gymName,
        setGymName,
        planTier,
        setPlanTier,
        planName,
        price,
        yearlyPrice,
        billingCycle,
        renewalDate,
        membersText,
        staffLimitText,
        dynamicFeatures,
        featureLimits,
        availablePlans,
        hasFeature,
        refreshSubscription,
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
