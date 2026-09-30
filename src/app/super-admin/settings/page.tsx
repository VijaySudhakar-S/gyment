'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { App } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { settingsApi, PlatformSettingsData } from '@/lib/api/superadmin/settings.api';
import { FormSkeleton } from '@/components/shared/skeletons';

export default function SettingsPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<
    'platform' | 'subscription' | 'notification' | 'profile'
  >('platform');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Platform State
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Subscription Settings State
  const [trialDuration, setTrialDuration] = useState('14 days');
  const [renewalRules, setRenewalRules] = useState('Auto-renew enabled');
  const [statusRules, setStatusRules] = useState('Suspend after 7 days past due');

  // Notification Alerts State
  const [emailNotif, setEmailNotif] = useState(true);
  const [subAlerts, setSubAlerts] = useState(true);
  const [newGymAlerts, setNewGymAlerts] = useState(true);

  // Admin Profile State
  const [adminId, setAdminId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await settingsApi.get();
      if (res.status && res.data) {
        const d = res.data;
        setPlatformName(d.platformName || 'Gyment');
        setSupportEmail(d.supportEmail || '');
        setSupportPhone(d.supportPhone || '');
        setCurrency(d.currency || 'INR');
        setTimezone(d.defaultTimezone || 'Asia/Kolkata');
        setMaintenanceMode(d.maintenanceMode || false);
        setMaintenanceMessage(d.maintenanceMessage || '');

        if (d.adminProfile) {
          setAdminId(d.adminProfile.id);
          setAdminName(d.adminProfile.name);
          setAdminEmail(d.adminProfile.email);
          setAdminPhone(d.adminProfile.mobile);
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load platform settings');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const tabs = [
    { key: 'platform', label: 'Platform Settings' },
    { key: 'subscription', label: 'Subscription Settings' },
    { key: 'notification', label: 'Notification Settings' },
    { key: 'profile', label: 'Admin Profile' },
  ];

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await settingsApi.updatePlatform({
        platformName,
        supportEmail,
        supportPhone,
        currency,
        defaultTimezone: timezone,
        maintenanceMode,
        maintenanceMessage: maintenanceMessage || null,
      });

      if (res.status) {
        message.success('Platform settings saved successfully');
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Subscription configuration saved');
  };

  const handleSaveNotif = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Notification preferences saved');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId) return;

    try {
      setIsSaving(true);
      const res = await settingsApi.updateProfile(adminId, {
        name: adminName,
        email: adminEmail,
        mobile: adminPhone,
        password: adminPassword || undefined,
      });

      if (res.status) {
        message.success('SuperAdmin profile updated successfully');
        setAdminPassword('');
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Configure platform-wide settings and system preferences."
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-5">
        {/* Tabs */}
        <MotionFadeIn delay={0.02} className="flex gap-4 border-b border-gyment-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2.5 px-1 mr-4 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.key
                ? 'text-gyment-text border-primary'
                : 'text-gyment-muted border-transparent hover:text-gyment-text'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </MotionFadeIn>

        {isLoading ? (
          <div className="bg-white border border-gyment-border rounded-[14px] p-5 max-w-3xl">
            <FormSkeleton fields={6} columns={2} />
          </div>
        ) : (
          <>
            {/* Panel 1: Platform Settings */}
            {activeTab === 'platform' && (
              <MotionFadeIn key="platform" delay={0.04} className="bg-white border border-gyment-border rounded-[14px] p-5 max-w-3xl">
            <form onSubmit={handleSavePlatform} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    GYMENT Platform Name
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={e => setPlatformName(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={e => setSupportEmail(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Support Phone
                  </label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={e => setSupportPhone(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Default Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white sm:w-1/2"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                  <input
                    type="checkbox"
                    id="maintMode"
                    checked={maintenanceMode}
                    onChange={e => setMaintenanceMode(e.target.checked)}
                    className="accent-primary w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="maintMode" className="text-xs font-bold text-gyment-text cursor-pointer">
                    Enable System Maintenance Mode (blocks non-superadmin access)
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </MotionFadeIn>
        )}

        {/* Panel 2: Subscription Settings */}
        {activeTab === 'subscription' && (
          <MotionFadeIn key="subscription" delay={0.04} className="bg-white border border-gyment-border rounded-[14px] p-5 max-w-3xl">
            <form onSubmit={handleSaveSub} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Default Trial Duration
                  </label>
                  <select
                    value={trialDuration}
                    onChange={e => setTrialDuration(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                  >
                    <option>7 days</option>
                    <option>14 days</option>
                    <option>30 days</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Renewal Rules
                  </label>
                  <select
                    value={renewalRules}
                    onChange={e => setRenewalRules(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                  >
                    <option>Auto-renew enabled</option>
                    <option>Manual renewal only</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Subscription Status Rules
                  </label>
                  <select
                    value={statusRules}
                    onChange={e => setStatusRules(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white sm:w-1/2"
                  >
                    <option>Suspend after 7 days past due</option>
                    <option>Suspend after 14 days past due</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </MotionFadeIn>
        )}

        {/* Panel 3: Notification Settings */}
        {activeTab === 'notification' && (
          <MotionFadeIn key="notification" delay={0.04} className="bg-white border border-gyment-border rounded-[14px] p-5 max-w-3xl">
            <form onSubmit={handleSaveNotif} className="space-y-4">
              <div className="space-y-1 divide-y divide-gyment-border text-[13px]">
                <div className="flex justify-between items-center py-2.5">
                  <span className="font-medium text-gyment-text">Email Notifications</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotif}
                      onChange={e => setEmailNotif(e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <span className="font-medium text-gyment-text">Subscription Expiry Alerts</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subAlerts}
                      onChange={e => setSubAlerts(e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <span className="font-medium text-gyment-text">New Gym Onboarding Alerts</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGymAlerts}
                      onChange={e => setNewGymAlerts(e.target.checked)}
                      className="accent-primary w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </MotionFadeIn>
        )}

        {/* Panel 4: Admin Profile */}
        {activeTab === 'profile' && (
          <MotionFadeIn key="profile" delay={0.04} className="bg-white border border-gyment-border rounded-[14px] p-5 max-w-3xl">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">Email Address</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">Phone / Mobile</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">Change Password (leave blank to keep)</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="New password (optional)"
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </MotionFadeIn>
        )}
        </>
      )}
      </main>
    </>
  );
}
