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

export type GymUserRole = 'GYM_ADMIN' | 'RECEPTIONIST' | 'TRAINER';

export interface GymAuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: GymUserRole;
  gymId: string;
  gymName?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface GymLoginResponseData {
  user: GymAuthUser;
  token: string;
  refreshtoken: string;
}

export interface GymLoginRequest extends LoginRequest {
  expectedRole?: GymUserRole;
}

export type RoleType =
  | 'SUPER_ADMIN'
  | 'GYM_ADMIN'
  | 'MANAGER'
  | 'TRAINER'
  | 'STAFF'
  | 'FRONT_DESK';

export interface tokenDTO {
  id: string;
  email: string;
  name: string;
  domain?: string;
  role: RoleType;
  permissions?: any;
}
