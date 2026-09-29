export type UserRole = 'Super Admin' | 'Gym Owner' | 'Staff' | 'Trainer';

export type UserStatus = 'Active' | 'Disabled';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  gym: string;
  status: UserStatus;
  created: string;
  lastLogin: string;
}
