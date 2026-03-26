export type AuthRole = "ADMIN" | "COMPANY" | "USER" | "UNKNOWN";

export interface AuthContext {
  role: AuthRole;
  companyId: string | null;
  userId: string | null;
}

const ROLE_CLAIM_KEYS = ["role", "user_role", "userRole", "type", "authorities"] as const;

const COMPANY_ID_CLAIM_KEYS = [
  "company_id",
  "companyId",
  "owner_company_id",
  "ownerCompanyId",
  "tenant_id",
  "tenantId",
  "organization_id",
  "organizationId",
] as const;

const USER_ID_CLAIM_KEYS = ["sub", "user_id", "userId", "id"] as const;

function normalizeString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

function normalizeRole(value: unknown): AuthRole {
  if (typeof value !== "string") {
    return "UNKNOWN";
  }

  const normalized = value.toUpperCase();
  if (normalized.includes("ADMIN")) {
    return "ADMIN";
  }
  if (normalized.includes("COMPANY")) {
    return "COMPANY";
  }
  if (normalized.includes("USER")) {
    return "USER";
  }
  return "UNKNOWN";
}

function extractRole(payload: Record<string, unknown>): AuthRole {
  for (const key of ROLE_CLAIM_KEYS) {
    const value = payload[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const roleValue of value) {
        const role = normalizeRole(roleValue);
        if (role !== "UNKNOWN") return role;
      }
      continue;
    }

    const role = normalizeRole(value);
    if (role !== "UNKNOWN") return role;
  }

  const nestedUser = payload.user;
  if (nestedUser && typeof nestedUser === "object" && !Array.isArray(nestedUser)) {
    return extractRole(nestedUser as Record<string, unknown>);
  }

  return "UNKNOWN";
}

function extractCompanyId(payload: Record<string, unknown>): string | null {
  for (const key of COMPANY_ID_CLAIM_KEYS) {
    const normalized = normalizeString(payload[key]);
    if (normalized) return normalized;
  }

  const nestedCompanyKeys = ["company", "tenant", "organization", "org", "ownerCompany"] as const;
  for (const key of nestedCompanyKeys) {
    const nested = payload[key];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;

    const nestedRecord = nested as Record<string, unknown>;
    const id = normalizeString(nestedRecord.id ?? nestedRecord.company_id ?? nestedRecord.companyId);
    if (id) return id;
  }

  const nestedUser = payload.user;
  if (nestedUser && typeof nestedUser === "object" && !Array.isArray(nestedUser)) {
    return extractCompanyId(nestedUser as Record<string, unknown>);
  }

  return null;
}

function extractUserId(payload: Record<string, unknown>): string | null {
  for (const key of USER_ID_CLAIM_KEYS) {
    const normalized = normalizeString(payload[key]);
    if (normalized) return normalized;
  }

  const nestedUser = payload.user;
  if (nestedUser && typeof nestedUser === "object" && !Array.isArray(nestedUser)) {
    return extractUserId(nestedUser as Record<string, unknown>);
  }

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  const payload = parts[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    let decoded = "";
    if (typeof atob === "function") {
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      decoded = new TextDecoder().decode(bytes);
    } else {
      return null;
    }

    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload) return true;

  const expRaw = payload.exp;
  if (typeof expRaw !== "number" && typeof expRaw !== "string") {
    return false;
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowSeconds;
}

export function extractAuthContextFromRecord(record: Record<string, unknown>): AuthContext {
  return {
    role: extractRole(record),
    companyId: extractCompanyId(record),
    userId: extractUserId(record),
  };
}

export function extractAuthContextFromToken(token: string | null | undefined): AuthContext {
  if (!token) {
    return { role: "UNKNOWN", companyId: null, userId: null };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { role: "UNKNOWN", companyId: null, userId: null };
  }

  return extractAuthContextFromRecord(payload);
}

export function isBackofficeRole(role: AuthRole): boolean {
  return role === "ADMIN" || role === "COMPANY";
}
