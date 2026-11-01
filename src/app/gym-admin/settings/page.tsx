'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymProfileSettings,
} from '@/types/gymAdmin';
import { SettingsTabsView } from '@/components/gym-admin/settings/SettingsComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { useGymAdmin } from '@/context/GymAdminContext';

export default function GymAdminSettingsPage() {

  const [profile, setProfile] = useState<GymProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const profRes = await gymAdminApi.getProfileSettings();
      if (profRes?.data) {
        setProfile(profRes.data);
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

  const { setGymName } = useGymAdmin();

  const handleSaveProfile = async (data: Partial<GymProfileSettings>) => {
    await gymAdminApi.updateProfileSettings(data);
    if (data.gymName) {
      setGymName(data.gymName);
    }
    fetchSettings();
  };

  return (
    <>
      <GymAdminTopbar
        title="Settings"
        subtitle="Manage your gym business profile and subscription preferences."
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-5">
        <MotionFadeIn delay={0.06}>
          <SettingsTabsView
            profile={profile}
            onSaveProfile={handleSaveProfile}
          />
        </MotionFadeIn>
      </main>
    </>
  );
}
