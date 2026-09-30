export interface PlatformSettingsDTO {
  platformName: string;
  currency: string;
  defaultTimezone: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  adminProfile?: {
    id: string;
    name: string;
    email: string;
    mobile: string;
  };
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
