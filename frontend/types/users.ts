export type UserRole = "admin" | "salesman" | "driver" | "manager" | "dispatcher" | "cashier";
export type UserStatus = "active" | "inactive";

export interface UserCreate {
  full_name: string;
  mobile: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  role?: UserRole;
}

export interface UserResponse {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserDeleteResponse {
  id: string;
  deleted_at: string;
}
