export interface User {
  id: string;
  name: string;
  email: string;
}

export interface login {
  email: string;
  password: string;
}

export interface IPayload {
  email: string;
  id: string;
}

export type RoleType =
  | "SUPER_ADMIN"
  | "GYM_ADMIN"
  | "MANAGER"
  | "TRAINER"
  | "STAFF"
  | "FRONT_DESK";

export interface tokenDTO {
  id: string;
  email: string;
  name: string;
  domain?: string;
  role: RoleType;
  permissions?: any;
}
