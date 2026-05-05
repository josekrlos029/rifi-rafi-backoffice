"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { resolveBackofficeAuthContext } from "@/lib/backoffice-auth-context";
import { extractAuthContextFromRecord } from "@/lib/auth-token";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookie";
import type { AuthResponse } from "@/types";
import { toast } from "sonner";

export function useLogin() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setRoleContext = useAuthStore((s) => s.setRoleContext);
  const clearTokens = useAuthStore((s) => s.clearTokens);

  return useMutation({
    mutationFn: async (credentials: { identifier: string; password: string }) => {
      const { data } = await apiClient.post<AuthResponse>("/auth/login", credentials);
      const roleContext = await resolveBackofficeAuthContext(
        data as unknown as Record<string, unknown>,
        async (accessToken) => {
          const { data: profileData } = await apiClient.get<Record<string, unknown>>("/users/me", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          return profileData;
        },
        extractAuthContextFromRecord
      );
      return { data, roleContext };
    },
    onSuccess: ({ data, roleContext }) => {
      setTokens(data.access_token, data.refresh_token);
      if (roleContext.role !== "UNKNOWN") {
        setRoleContext(roleContext.role, roleContext.companyId, roleContext.userId);
      }
      if (roleContext.role === "USER" || roleContext.role === "UNKNOWN") {
        clearTokens();
        clearAuthCookies();
        toast.error("Tu rol no tiene acceso al backoffice.");
        router.replace("/login");
        return;
      }
      setAuthCookies(data.access_token, roleContext.role);
      router.push("/gym-configs");
    },
    onError: () => {
      toast.error("Credenciales inválidas");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearTokens = useAuthStore((s) => s.clearTokens);

  return () => {
    clearTokens();
    clearAuthCookies();
    router.push("/login");
  };
}
