"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { extractAuthContextFromRecord } from "@/lib/auth-token";
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
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      const roleContext = extractAuthContextFromRecord(data as unknown as Record<string, unknown>);
      if (roleContext.role !== "UNKNOWN") {
        setRoleContext(roleContext.role, roleContext.companyId, roleContext.userId);
      }
      if (roleContext.role === "USER" || roleContext.role === "UNKNOWN") {
        clearTokens();
        document.cookie = "rifi-auth-token=; path=/; max-age=0";
        toast.error("Tu rol no tiene acceso al backoffice.");
        router.replace("/login");
        return;
      }
      // Set cookie for middleware
      document.cookie = `rifi-auth-token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
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
    document.cookie = "rifi-auth-token=; path=/; max-age=0";
    router.push("/login");
  };
}
