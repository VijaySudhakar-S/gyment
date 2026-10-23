import React, { useState } from 'react';
import {
  GymProfileSettings,
  GymMembershipSettings,
  GymBrandingSettings,
  GymStaff,
} from '@/types/gymAdmin';
import { useGymAdmin } from '@/context/GymAdminContext';
import { GYMENT_PLANS, fmtRs } from '@/utils/gymAdminHelpers';
import { LockedCard } from '@/components/gym-admin/shared/LockedCard';
import { Building2, CreditCard, Users, ShieldCheck, Palette, Save } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App } from 'antd';

export const SettingsTabsView: React.FC<{
  profile: GymProfileSettings | null;
  membershipSettings: GymMembershipSettings | null;
  brandingSettings: GymBrandingSettings | null;
  staffList: GymStaff[];
  onSaveProfile: (p: Partial<GymProfileSettings>) => Promise<void>;
  onSaveMembership: (m: Partial<GymMembershipSettings>) => Promise<void>;
  onSaveBranding: (b: Partial<GymBrandingSettings>) => Promise<void>;
}> = ({
  profile,
  membershipSettings,
  brandingSettings,
  staffList,
  onSaveProfile,
  onSaveMembership,
  onSaveBranding,
}) => {
  const { planTier, openCompareModal, hasFeature } = useGymAdmin();
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'membership' | 'users' | 'subscription' | 'branding'
  >('profile');

  // Profile Form State
  const [profileForm, setProfileForm] = useState<GymProfileSettings>({
    gymName: profile?.gymName || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    workingHours: profile?.workingHours || '6:00 AM – 10:00 PM',
    address: profile?.address || '',
    ownerName: profile?.ownerName || '',
  });

  // Membership Form State
  const [membershipForm, setMembershipForm] = useState<GymMembershipSettings>({
    defaultDuration: membershipSettings?.defaultDuration || 'Monthly',
    expiryReminderDays: membershipSettings?.expiryReminderDays || 7,
    gracePeriodDays: membershipSettings?.gracePeriodDays || 3,
  });

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState<GymBrandingSettings>({
    brandName: brandingSettings?.brandName || profileForm.gymName || '',
    accentColor: brandingSettings?.accentColor || '#2FAE68',
    customBrandingEnabled: brandingSettings?.customBrandingEnabled ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const canCustomBrand = hasFeature('Custom Gym Branding');
  const planInfo = GYMENT_PLANS[planTier];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveProfile(profileForm);
      message.success('Gym profile saved successfully');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveMembership(membershipForm);
      message.success('Membership settings updated successfully');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveBranding(brandingForm);
      message.success('Custom branding preferences updated');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Gym Profile', icon: Building2 },
    { id: 'membership', label: 'Membership Settings', icon: CreditCard },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'subscription', label: 'Gyment Subscription', icon: ShieldCheck },
    { id: 'branding', label: 'Custom Branding', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs list */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'branding' && !canCustomBrand) {
                  message.info('Custom Gym Branding is available in the Pro plan');
                }
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`flex items-center gap-2 py-3 px-3.5 text-[13.5px] font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary-dark dark:text-emerald-400'
                  : 'border-transparent text-muted hover:text-gyment-text dark:hover:text-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'branding' && !canCustomBrand && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 ml-1">
                  🔒 Pro
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Gym Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-xs max-w-2xl space-y-4 text-[13.5px]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
                Gym Name
              </label>
              <input
                type="text"
                value={profileForm.gymName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, gymName: e.target.value })
                }
                className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">Phone</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
                Working Hours
              </label>
              <input
                type="text"
                value={profileForm.workingHours}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, workingHours: e.target.value })
                }
                className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
                Address
              </label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, address: e.target.value })
                }
                className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <PrimaryButton
              type="submit"
              disabled={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* Tab 2: Membership Settings */}
      {activeTab === 'membership' && (
        <form
          onSubmit={handleSaveMembership}
          className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-xs max-w-xl space-y-4 text-[13.5px]"
        >
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
              Default Membership Duration
            </label>
            <select
              value={membershipForm.defaultDuration}
              onChange={(e) =>
                setMembershipForm({ ...membershipForm, defaultDuration: e.target.value })
              }
              className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
              Expiry Reminder Notice
            </label>
            <select
              value={membershipForm.expiryReminderDays}
              onChange={(e) =>
                setMembershipForm({
                  ...membershipForm,
                  expiryReminderDays: Number(e.target.value),
                })
              }
              className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none cursor-pointer"
            >
              <option value={3}>3 days before</option>
              <option value={7}>7 days before</option>
              <option value={15}>15 days before</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
              Grace Period
            </label>
            <select
              value={membershipForm.gracePeriodDays}
              onChange={(e) =>
                setMembershipForm({
                  ...membershipForm,
                  gracePeriodDays: Number(e.target.value),
                })
              }
              className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none cursor-pointer"
            >
              <option value={0}>0 days (Immediate)</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <PrimaryButton
              type="submit"
              disabled={isSaving}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-xs max-w-xl space-y-3 text-[13.5px]">
          <div className="flex items-center justify-between py-2.5 border-b border-dashed border-border/80">
            <div>
              <div className="font-bold text-gyment-text text-[13.5px]">
                {profile?.ownerName || 'Gym Owner'}
              </div>
              <div className="text-xs text-muted">Gym Owner</div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Active
            </span>
          </div>

          {staffList.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-2.5 border-b border-dashed border-border/80"
            >
              <div>
                <div className="font-bold text-gyment-text text-[13.5px]">{s.name}</div>
                <div className="text-xs text-muted">
                  {s.role} · {s.email}
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Subscription */}
      {activeTab === 'subscription' && (
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-xs max-w-xl space-y-3.5 text-[13.5px]">
          <div className="flex justify-between py-2 border-b border-dashed border-border/80">
            <span className="text-muted">Current plan</span>
            <span className="font-bold text-gyment-text text-[14px]">
              {planInfo.name}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-border/80">
            <span className="text-muted">Billing cycle</span>
            <span className="font-semibold text-gyment-text">
              Monthly
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-border/80">
            <span className="text-muted">Price</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
              {fmtRs(planInfo.price)}/month
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-dashed border-border/80">
            <span className="text-muted">Next renewal date</span>
            <span className="font-semibold text-gyment-text">
              Active
            </span>
          </div>
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={openCompareModal}
              className="bg-primary hover:bg-primary-dark text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Branding */}
      {activeTab === 'branding' && (
        <div className="max-w-2xl">
          {canCustomBrand ? (
            <form
              onSubmit={handleSaveBranding}
              className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 text-[13.5px]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brandingForm.brandName}
                    onChange={(e) =>
                      setBrandingForm({ ...brandingForm, brandName: e.target.value })
                    }
                    className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingForm.accentColor}
                      onChange={(e) =>
                        setBrandingForm({ ...brandingForm, accentColor: e.target.value })
                      }
                      className="w-10 h-10 p-0 border border-border rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandingForm.accentColor}
                      onChange={(e) =>
                        setBrandingForm({ ...brandingForm, accentColor: e.target.value })
                      }
                      className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none flex-1"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="font-bold text-gyment-text text-xs uppercase tracking-wide">
                    Branding Status
                  </label>
                  <select
                    value={brandingForm.customBrandingEnabled ? 'Enabled' : 'Disabled'}
                    onChange={(e) =>
                      setBrandingForm({
                        ...brandingForm,
                        customBrandingEnabled: e.target.value === 'Enabled',
                      })
                    }
                    className="border border-border bg-white rounded-lg p-2.5 text-[13.5px] text-gyment-text outline-none cursor-pointer"
                  >
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <PrimaryButton
                  type="submit"
                  disabled={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  Save Branding
                </PrimaryButton>
              </div>
            </form>
          ) : (
            <LockedCard
              title="Custom Gym Branding"
              planRequired="Pro"
              description="Add your custom logo, brand name, and custom theme accent color across the gym owner and member dashboard."
            />
          )}
        </div>
      )}
    </div>
  );
};
