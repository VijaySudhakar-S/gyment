export interface createDTO {
  name: string;
  email: string;
  phoneNo?: string | null;
  password: string;
}

export interface deleteDTO {
  email: string;
}

export interface forgotPassword {
  email: string;
  code?: string;
}

export interface updateDTO {
  email?: string;
  name?: string;
  phoneNo?: string;
}

export interface readDTO {
  id: string;
}

export interface loginUserDTO {
  email: string;
  password: string;
}
