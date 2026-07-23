// Matches TokenResponse.principal_type from POST /api/v1/auth/login — the
// backend only distinguishes "user" (any staff role) vs "customer" at login.
// The specific staff role (admin/salesman/driver/...) isn't in the login
// response, so it's fetched separately via GET /users/me and cached here
// (see useLogin.ts) once that call resolves.
import type { UserRole } from "@/types/users";

export type PrincipalType = "user" | "customer";
export type StaffRole = UserRole;

const TOKEN_KEY = "dms_token";
const ROLE_KEY = "dms_role";
const STAFF_ROLE_KEY = "dms_staff_role";

// Stored as plain (non-httpOnly) cookies so both the browser (axios) and
// proxy.ts (route guarding) can read them.
// TODO: move token issuance behind a Next.js route handler that sets an
// httpOnly cookie before going to production.

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getToken(): string | null {
  return readCookie(TOKEN_KEY);
}

export function getPrincipalType(): PrincipalType | null {
  return readCookie(ROLE_KEY) as PrincipalType | null;
}

export function setSession(token: string, principalType: PrincipalType) {
  writeCookie(TOKEN_KEY, token);
  writeCookie(ROLE_KEY, principalType);
}

export function getStaffRole(): StaffRole | null {
  return readCookie(STAFF_ROLE_KEY) as StaffRole | null;
}

export function setStaffRole(role: StaffRole) {
  writeCookie(STAFF_ROLE_KEY, role);
}

export function clearSession() {
  deleteCookie(TOKEN_KEY);
  deleteCookie(ROLE_KEY);
  deleteCookie(STAFF_ROLE_KEY);
}

export function isStaff(principalType: PrincipalType | null): boolean {
  return principalType === "user";
}
