import { create } from "zustand";
import { persist } from "zustand/middleware";
import { extractAuthContextFromToken, type AuthRole } from "@/lib/auth-token";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: AuthRole;
  companyId: string | null;
  userId: string | null;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (access: string) => void;
  setRoleContext: (role: AuthRole, companyId: string | null, userId: string | null) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: "UNKNOWN",
      companyId: null,
      userId: null,
      setTokens: (access, refresh) => {
        const context = extractAuthContextFromToken(access);
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
          role: context.role,
          companyId: context.companyId,
          userId: context.userId,
        });
      },
      setAccessToken: (access) => {
        const context = extractAuthContextFromToken(access);
        set((state) => {
          const isSameState =
            state.accessToken === access &&
            state.role === context.role &&
            state.companyId === context.companyId &&
            state.userId === context.userId &&
            state.isAuthenticated;

          if (isSameState) {
            return state;
          }

          return {
            accessToken: access,
            isAuthenticated: true,
            role: context.role,
            companyId: context.companyId,
            userId: context.userId,
          };
        });
      },
      setRoleContext: (role, companyId, userId) =>
        set({
          role,
          companyId,
          userId,
        }),
      clearTokens: () =>
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: "UNKNOWN",
          companyId: null,
          userId: null,
        }),
    }),
    { name: "rifi-auth" }
  )
);
