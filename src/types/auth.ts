export interface LoginRequest {
  email: string;
  password: string;
}

export interface SuperAdminUser {
  id: string;
  email: string;
  name: string;
  mobile: string;
  role: 'SUPER_ADMIN';
  lastLogin?: string;
  isActive?: boolean;
}

export interface LoginResponseData {
  user: SuperAdminUser;
  token: string;
  refreshtoken: string;
}
