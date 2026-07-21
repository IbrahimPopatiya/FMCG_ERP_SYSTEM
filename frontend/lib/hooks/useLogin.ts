import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { login } from "@/lib/api/auth";
import { setSession } from "@/lib/auth/session";
import type { LoginRequest } from "@/types/auth";

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data) => {
      setSession(data.access_token, data.principal_type);
    },
  });
}

export function loginErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 401) {
    return "The mobile/email or password you entered is incorrect.";
  }
  return "Something went wrong. Please check your connection and try again.";
}
