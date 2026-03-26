"use client";

import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/lib/auth-store";

export function useRoleAccess() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.role);
  const companyId = useAuthStore((s) => s.companyId);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  useEffect(() => {
    if (accessToken && role === "UNKNOWN") {
      setAccessToken(accessToken);
    }
  }, [accessToken, role, setAccessToken]);

  return useMemo(() => {
    const isAdmin = role === "ADMIN";
    const isCompany = role === "COMPANY";
    const isKnownRole = isAdmin || isCompany;
    const hasValidCompanyScope = !isCompany || Boolean(companyId);

    return {
      role,
      companyId,
      isAdmin,
      isCompany,
      isKnownRole,
      hasValidCompanyScope,
      canManageGlobalCatalogs: isAdmin,
      canManageQuestions: isAdmin || isCompany,
      canManageForms: isAdmin || isCompany,
      canManageGymConfigs: isAdmin || isCompany,
      canViewCatalogs: isAdmin || isCompany,
      canMutateManagedResources: isAdmin || (isCompany && hasValidCompanyScope),
    };
  }, [companyId, role]);
}
