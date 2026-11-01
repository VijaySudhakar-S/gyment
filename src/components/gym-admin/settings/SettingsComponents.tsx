import React, { useState, useEffect } from 'react';
import { GymProfileSettings } from '@/types/gymAdmin';
import { useGymAdmin } from '@/context/GymAdminContext';
import { fmtRs } from '@/utils/gymAdminHelpers';
import {
  Building2,
  Save,
  ArrowRight,
  Clock,
  MapPin,
  Mail,
  Phone,
  User,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';
import { App, TimePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const SettingsTabsView: React.FC<{
  profile: GymProfileSettings | null;
  onSaveProfile: (p: Partial<GymProfileSettings>) => Promise<void>;
}> = ({ profile, onSaveProfile }) => {
  const {
    planName,
    price,
    billingCycle,
    openCompareModal,
  } = useGymAdmin();
  const { message } = App.useApp();

  // Profile Form State
  const [profileForm, setProfileForm] = useState<GymProfileSettings>({
    gymName: profile?.gymName || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    workingHours: profile?.workingHours || '6:00 AM – 10:00 PM',
    address: profile?.address || '',
    ownerName: profile?.ownerName || '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Parse working hours string to Dayjs range (e.g. "06:00 AM – 10:00 PM" or "6:00 AM - 10:00 PM")
  const parseWorkingHours = (hoursStr: string): [Dayjs, Dayjs] | null => {
    if (!hoursStr) return null;
    const parts = hoursStr.split(/[-–—]/).map((p) => p.trim());
    if (parts.length >= 2) {
      const start = dayjs(parts[0], ['hh:mm A', 'h:mm A', 'HH:mm'], true);
      const end = dayjs(parts[1], ['hh:mm A', 'h:mm A', 'HH:mm'], true);
      if (start.isValid() && end.isValid()) {
        return [start, end];
      }
    }
    return [dayjs('06:00 AM', 'hh:mm A'), dayjs('10:00 PM', 'hh:mm A')];
  };

  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(() =>
    parseWorkingHours(profile?.workingHours || '06:00 AM – 10:00 PM')
  );

  useEffect(() => {
    if (profile) {
      setProfileForm((prev) => ({
        ...prev,
        gymName: profile.gymName || prev.gymName,
        phone: profile.phone || prev.phone,
        email: profile.email || prev.email,
        workingHours: profile.workingHours || prev.workingHours,
        address: profile.address || prev.address,
        ownerName: profile.ownerName || prev.ownerName,
      }));
      if (profile.workingHours) {
        setTimeRange(parseWorkingHours(profile.workingHours));
      }
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await onSaveProfile(profileForm);
      message.success('Gym profile updated successfully');
    } catch {
      message.error('Failed to update gym profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-8">
      {/* 1. Subscription Banner: Sleek, borderless-feel, frosted glass styling */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              Active Subscription
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-gyment-text tracking-tight">
                {planName}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            </div>
            <p className="text-[13px] text-muted max-w-lg leading-relaxed">
              Your club operates with Gyment SaaS. Core member attendance, billing, and reporting modules are active.
            </p>
          </div>

          <div className="flex items-center gap-6 sm:gap-8 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/80 md:pl-8">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted font-bold">Investment</div>
              <div className="text-2xl font-black text-gyment-text mt-0.5 tracking-tight">
                {fmtRs(price)}
                <span className="text-xs font-medium text-muted ml-1">/{billingCycle.toLowerCase()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCompareModal}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm px-4.5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer inline-flex items-center gap-2 shrink-0 active:scale-98"
            >
              Change Plan <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Business Profile: Modern Flat Form Layout with Left Column Context & Right Column Inputs */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-stone-800 shadow-sm overflow-hidden">

          {/* Section Header */}
          <div className="px-6 py-4 sm:px-8 flex items-center justify-between border-b border-gray-200 dark:border-stone-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gyment-text text-base sm:text-lg">Business Identity & Contact</h3>
              </div>
            </div>
          </div>

          {/* Form Fields: Grid layout with floating labels & subtle icons */}
          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              {/* Gym Name */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-gyment-text flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Gym Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Iron Forge Fitness"
                  value={profileForm.gymName}
                  onChange={(e) => setProfileForm({ ...profileForm, gymName: e.target.value })}
                  className="w-full bg-background border border-border/90 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-2xs placeholder:text-muted/60"
                />
              </div>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-gyment-text flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> Gym Owner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={profileForm.ownerName}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                  className="w-full bg-background border border-border/90 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-2xs placeholder:text-muted/60"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-gyment-text flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Official Contact Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-background border border-border/90 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-2xs placeholder:text-muted/60"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-gyment-text flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Support & Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. info@ironforge.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-background border border-border/90 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-2xs placeholder:text-muted/60"
                />
              </div>

              {/* Operating & Working Hours */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-gyment-text flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Operating & Working Hours
                  </span>
                  {profileForm.workingHours && (
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      {profileForm.workingHours}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <TimePicker.RangePicker
                    use12Hours
                    format="h:mm A"
                    minuteStep={15}
                    placeholder={['Opening Time', 'Closing Time']}
                    value={timeRange}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setTimeRange([dates[0], dates[1]]);
                        const formatted = `${dates[0].format('hh:mm A')} – ${dates[1].format('hh:mm A')}`;
                        setProfileForm((prev) => ({ ...prev, workingHours: formatted }));
                      } else {
                        setTimeRange(null);
                        setProfileForm((prev) => ({ ...prev, workingHours: '' }));
                      }
                    }}
                    className="w-full !bg-background !border-border/90 !rounded-xl !py-2.5 text-[13.5px] shadow-2xs hover:!border-primary focus:!border-primary"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-bold text-gyment-text flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Gym Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. 42 West Avenue, Saravanampatti, Coimbatore - 641006"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full bg-background border border-border/90 rounded-xl px-3.5 py-2.5 text-[13.5px] text-gyment-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-2xs placeholder:text-muted/60"
                />
              </div>

            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 pb-4 sm:px-8 flex items-center justify-between">
            <div className="ml-auto">
              <PrimaryButton
                type="submit"
                disabled={isSavingProfile}
                icon={<Save className="w-4 h-4" />}
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
              </PrimaryButton>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};
