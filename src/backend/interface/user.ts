import { GymRole, UserStatus } from '@adminDB/index';

export type UserTypeCategory = 'SUPER_ADMIN' | 'GYM_USER';

export interface forgotPassword {
  email: string;
  code?: string;
}

export interface loginUserDTO {
  email: string;
  password: string;
}

export interface CreateSuperAdminDTO {
  userType: 'SUPER_ADMIN';
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface CreateGymUserDTO {
  userType: 'GYM_USER';
  name: string;
  email: string;
  phone: string;
  gymId: string;
  role: GymRole;
  password?: string;
}

export type CreateUserDTO = CreateSuperAdminDTO | CreateGymUserDTO;

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  role?: GymRole;
  gymId?: string;
}

export interface UserFilterDTO {
  search?: string;
  userType?: UserTypeCategory | '';
  role?: GymRole | 'SUPER_ADMIN' | '';
  gymId?: string;
  status?: UserStatus | '';
}

export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  userType: UserTypeCategory;
  role: string;
  gymId: string | null;
  gymName: string | null;
  status: UserStatus;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
