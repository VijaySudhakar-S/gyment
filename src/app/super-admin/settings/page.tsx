'use client';

import React, { useState } from 'react';
import { App } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';

export default function SettingsPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<
    'platform' | 'subscription' | 'notification' | 'profile'
  >('platform');

  const [platformName, setPlatformName] = useState('GYMENT');
  const [supportEmail, setSupportEmail] = useState('support@gyment.app');
  const [supportPhone, setSupportPhone] = useState('+91 80000 12345');
  const [currency, setCurrency] = useState('INR (₹)');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');

  const [trialDuration, setTrialDuration] = useState('14 days');
  const [renewalRules, setRenewalRules] = useState('Auto-renew enabled');
  const [statusRules, setStatusRules] = useState('Suspend after 7 days past due');

  const [emailNotif, setEmailNotif] = useState(true);
  const [subAlerts, setSubAlerts] = useState(true);
  const [newGymAlerts, setNewGymAlerts] = useState(true);

  const [adminName, setAdminName] = useState('Sanjay Kumar');
  const [adminEmail, setAdminEmail] = useState('sanjay@gyment.app');
  const [adminPhone, setAdminPhone] = useState('+91 90000 11223');

  const tabs = [
    { key: 'platform', label: 'Platform Settings' },
    { key: 'subscription', label: 'Subscription Settings' },
    { key: 'notification', label: 'Notification Settings' },
    { key: 'profile', label: 'Admin Profile' },
  ];

  const handleSavePlatform = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Platform settings saved');
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Subscription settings saved');
  };

  const handleSaveNotif = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Notification settings saved');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    message.success('Profile updated');
  };

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Configure platform-wide behavior."
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-5">
        {/* Tabs */}
        <MotionFadeIn delay={0.02} className="flex gap-4 border-b border-gyment-border overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2.5 px-1 mr-4 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key
                ? 'text-gyment-text border-primary'
                : 'text-gyment-muted border-transparent hover:text-gyment-text'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </MotionFadeIn>

        {/* Panel 1: Platform Settings */}
        {activeTab === 'platform' && (
          <MotionFadeIn key="platform" delay={0.04} className="bg-white border border-gyment-border rounded-[14px] p-5 max-w-3xl">
            <form onSubmit={handleSavePlatform} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    GYMENT Name
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={e => setPlatformName(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
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
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
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
                    <option>Asia/Kolkata (IST)</option>
                    <option>UTC</option>
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

        {/* Panel 2: Subscription Settings */}
        {activeTab === 'subscription' && (
          <MotionFadeIn key="subscription" delay={0.04} className="bg-white border border-gyment-border rounded-[14px] p-5 max-w-3xl">
            <form onSubmit={handleSaveSub} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Trial Duration
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
                      className="accent-primary w-4 h-4"
                    />
                  </label>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <span className="font-medium text-gyment-text">Subscription Alerts</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subAlerts}
                      onChange={e => setSubAlerts(e.target.checked)}
                      className="accent-primary w-4 h-4"
                    />
                  </label>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <span className="font-medium text-gyment-text">New Gym Alerts</span>
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGymAlerts}
                      onChange={e => setNewGymAlerts(e.target.checked)}
                      className="accent-primary w-4 h-4"
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
                  <label className="text-[12px] font-bold text-gyment-text">Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">Phone</label>
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                    className="border border-gyment-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-gyment-text">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    className="border border-gyment-border rounded-lg px-3 py-1.5 text-xs outline-none file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark"
                  />
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
      </main>
    </>
  );
}
