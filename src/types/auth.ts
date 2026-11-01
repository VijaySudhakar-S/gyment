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
  | 'FRONT_DESK'
  | 'MEMBER';

export interface tokenDTO {
  id: string;
  email: string;
  name: string;
  domain?: string;
  role: RoleType;
  permissions?: any;
}

export interface MemberAuthUser {
  id: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email?: string | null;
  avatar?: string | null;
  status: string;
  gymId: string;
  gymName: string;
  planName: string;
  planExpiry: string;
  daysRemaining: number;
  balanceAmount: number;
}

export interface MemberLoginResponseData {
  member: MemberAuthUser;
  token: string;
}

