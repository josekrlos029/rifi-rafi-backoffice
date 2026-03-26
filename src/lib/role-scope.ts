import type { AuthRole } from "@/lib/auth-token";

export interface ScopeOptions {
  role: AuthRole;
  companyId?: string | null;
}

export function buildRoleScopedParams(
  params: Record<string, unknown> | undefined,
  options: ScopeOptions
) {
  const scoped = { ...(params ?? {}) } as Record<string, unknown>;
  if (options.role === "COMPANY") {
    scoped.scope = "own";
    if (options.companyId) {
      scoped.company_id = options.companyId;
    }
  }
  return scoped;
}
