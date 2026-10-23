'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymProfileSettings,
  GymMembershipSettings,
  GymBrandingSettings,
  GymStaff,
} from '@/types/gymAdmin';
import { SettingsTabsView } from '@/components/gym-admin/settings/SettingsComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';

export default function GymAdminSettingsPage() {

  const [profile, setProfile] = useState<GymProfileSettings | null>(null);
  const [membershipSettings, setMembershipSettings] = useState<GymMembershipSettings | null>(null);
  const [brandingSettings, setBrandingSettings] = useState<GymBrandingSettings | null>(null);
  const [staffList, setStaffList] = useState<GymStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profRes, memRes, brandRes, staffRes] = await Promise.allSettled([
        gymAdminApi.getProfileSettings(),
        gymAdminApi.getMembershipSettings(),
        gymAdminApi.getBrandingSettings(),
        gymAdminApi.getStaff(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value?.data) {
        setProfile(profRes.value.data);
      }
      if (memRes.status === 'fulfilled' && memRes.value?.data) {
        setMembershipSettings(memRes.value.data);
      }
      if (brandRes.status === 'fulfilled' && brandRes.value?.data) {
        setBrandingSettings(brandRes.value.data);
      }
      if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.data)) {
        setStaffList(staffRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveProfile = async (data: Partial<GymProfileSettings>) => {
    await gymAdminApi.updateProfileSettings(data);
    fetchSettings();
  };

  const handleSaveMembership = async (data: Partial<GymMembershipSettings>) => {
    await gymAdminApi.updateMembershipSettings(data);
    fetchSettings();
  };

  const handleSaveBranding = async (data: Partial<GymBrandingSettings>) => {
    await gymAdminApi.updateBrandingSettings(data);
    fetchSettings();
  };

  return (
    <>
      <GymAdminTopbar
        title="Settings"
        subtitle="Manage your gym profile, plan and preferences."
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-5">
        <MotionFadeIn delay={0.06}>
          <SettingsTabsView
            profile={profile}
            membershipSettings={membershipSettings}
            brandingSettings={brandingSettings}
            staffList={staffList}
            onSaveProfile={handleSaveProfile}
            onSaveMembership={handleSaveMembership}
            onSaveBranding={handleSaveBranding}
          />
        </MotionFadeIn>
      </main>
    </>
  );
}
