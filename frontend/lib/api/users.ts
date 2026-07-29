import { api } from "@/lib/api/client";
import type { UserCreate, UserDeleteResponse, UserResponse, UserStatus, UserUpdate } from "@/types/users";

export function listUsers() {
  return api.get<UserResponse[]>("/users").then((res) => res.data);
}

export function getCurrentUser() {
  return api.get<UserResponse>("/users/me").then((res) => res.data);
}

export function createUser(data: UserCreate) {
  return api.post<UserResponse>("/users", data).then((res) => res.data);
}

export function updateUser(userId: string, data: UserUpdate) {
  return api.patch<UserResponse>(`/users/${userId}`, data).then((res) => res.data);
}

export function setUserStatus(userId: string, status: UserStatus) {
  return api.patch<UserResponse>(`/users/${userId}/status`, { status }).then((res) => res.data);
}

export function deleteUser(userId: string) {
  return api.delete<UserDeleteResponse>(`/users/${userId}`).then((res) => res.data);
}
