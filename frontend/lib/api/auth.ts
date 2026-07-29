import { api } from "@/lib/api/client";
import type { LoginRequest, TokenResponse } from "@/types/auth";

export function login(data: LoginRequest) {
  return api.post<TokenResponse>("/auth/login", data).then((res) => res.data);
}
