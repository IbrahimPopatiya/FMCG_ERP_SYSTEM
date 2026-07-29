import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { login } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/api/users";
import { setSession, setStaffRole } from "@/lib/auth/session";
import type { LoginRequest } from "@/types/auth";

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: async (data) => {
      setSession(data.access_token, data.principal_type);

      // Login only tells us "user" vs "customer" - the specific staff role
      // (admin/salesman/driver/...) needs a follow-up call to /users/me.
      if (data.principal_type === "user") {
        const user = await getCurrentUser();
        setStaffRole(user.role);
      }
    },
  });
}

export function loginErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 401) {
    return "The mobile/email or password you entered is incorrect.";
  }
  return "Something went wrong. Please check your connection and try again.";
}
