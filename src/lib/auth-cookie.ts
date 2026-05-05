import type { AuthRole } from "./auth-token";

const WEEK_SECONDS = 60 * 60 * 24 * 7;

function isPersistedBackofficeRole(role: AuthRole): boolean {
  return role === "ADMIN" || role === "COMPANY";
}

export function setAuthCookies(accessToken: string, role: AuthRole): void {
  if (typeof document === "undefined") return;

  document.cookie = `rifi-auth-token=${accessToken}; path=/; max-age=${WEEK_SECONDS}`;
  if (isPersistedBackofficeRole(role)) {
    document.cookie = `rifi-auth-role=${role}; path=/; max-age=${WEEK_SECONDS}`;
    return;
  }

  document.cookie = "rifi-auth-role=; path=/; max-age=0";
}

export function clearAuthCookies(): void {
  if (typeof document === "undefined") return;

  document.cookie = "rifi-auth-token=; path=/; max-age=0";
  document.cookie = "rifi-auth-role=; path=/; max-age=0";
}
