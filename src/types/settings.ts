export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

export interface PlatformSettingsDTO {
  platformName: string;
  currency: string;
  defaultTimezone: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  adminProfile?: AdminProfile;
}

export interface UpdatePlatformSettingsDTO {
  platformName?: string;
  currency?: string;
  defaultTimezone?: string;
  supportEmail?: string;
  supportPhone?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
}

export interface UpdateAdminProfileDTO {
  name?: string;
  email?: string;
  mobile?: string;
  password?: string;
}

// Aliases
export type PlatformSettingsData = PlatformSettingsDTO;
export type UpdatePlatformSettingsPayload = UpdatePlatformSettingsDTO;
export type UpdateAdminProfilePayload = UpdateAdminProfileDTO;
