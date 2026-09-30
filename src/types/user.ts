export type UserTypeCategory = 'SUPER_ADMIN' | 'GYM_USER';

export type GymRole = 'GYM_ADMIN' | 'RECEPTIONIST' | 'TRAINER';

export type UserSystemRole = 'SUPER_ADMIN' | GymRole;

export type UserRole = 'Super Admin' | 'Gym Owner' | 'Staff' | 'Trainer';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  userType: UserTypeCategory;
  role: string;
  gymId: string | null;
  gymName: string | null;
  status: UserStatus;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export type User = UserItem;

export interface CreateSuperAdminPayload {
  userType: 'SUPER_ADMIN';
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface CreateGymUserPayload {
  userType: 'GYM_USER';
  name: string;
  email: string;
  phone: string;
  gymId: string;
  role: GymRole;
  password?: string;
}

export type CreateUserPayload = CreateSuperAdminPayload | CreateGymUserPayload;

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  role?: GymRole;
  gymId?: string;
}

export interface UserFilterParams {
  search?: string;
  userType?: UserTypeCategory | '';
  role?: GymRole | 'SUPER_ADMIN' | '';
  gymId?: string;
  status?: UserStatus | '';
}
