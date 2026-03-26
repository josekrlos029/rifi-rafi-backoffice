import type { AuthRole } from "@/lib/auth-token";

interface OwnershipFilterOptions {
  role: AuthRole;
  companyId: string | null;
  allowGlobalWhenCompanyMissing?: boolean;
}

const COMPANY_KEYS = [
  "company_id",
  "companyId",
  "owner_company_id",
  "ownerCompanyId",
  "tenant_id",
  "tenantId",
  "organization_id",
  "organizationId",
] as const;

const NESTED_KEYS = [
  "company",
  "owner_company",
  "ownerCompany",
  "organization",
  "tenant",
  "created_by",
  "createdBy",
  "owner",
  "form",
  "question",
  "campaign",
] as const;

function normalizeId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

function extractCompanyId(value: unknown, depth = 0): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 4) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of COMPANY_KEYS) {
    const id = normalizeId(record[key]);
    if (id) return id;
  }

  for (const key of NESTED_KEYS) {
    const id = extractCompanyId(record[key], depth + 1);
    if (id) return id;
  }

  return null;
}

export function applyCompanyOwnershipFilter<T>(
  items: T[],
  options: OwnershipFilterOptions
): T[] {
  if (options.role !== "COMPANY" || !options.companyId) {
    return items;
  }

  return items.filter((item) => {
    const ownerCompanyId = extractCompanyId(item);
    if (!ownerCompanyId) {
      return options.allowGlobalWhenCompanyMissing ?? true;
    }
    return ownerCompanyId === options.companyId;
  });
}
