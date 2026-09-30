export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

export interface PlatformSettingsData {
  platformName: string;
  currency: string;
  defaultTimezone: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  adminProfile?: AdminProfile;
}

export interface UpdatePlatformSettingsPayload {
  platformName?: string;
  currency?: string;
  defaultTimezone?: string;
  supportEmail?: string;
  supportPhone?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
}

export interface UpdateAdminProfilePayload {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
}
