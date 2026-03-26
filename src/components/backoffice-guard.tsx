"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { isBackofficeRole } from "@/lib/auth-token";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BackofficeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore((state) => state.role);
  const clearTokens = useAuthStore((state) => state.clearTokens);
  const isHydrated = useSyncExternalStore(
    (onStoreChange) => {
      const persistApi = useAuthStore.persist;
      if (!persistApi) return () => {};

      const unsubscribeStart = persistApi.onHydrate(onStoreChange);
      const unsubscribeFinish = persistApi.onFinishHydration(onStoreChange);

      return () => {
        unsubscribeStart();
        unsubscribeFinish();
      };
    },
    () => useAuthStore.persist?.hasHydrated() ?? true,
    () => false
  );

  const hasBackofficeAccess = isBackofficeRole(role);

  useEffect(() => {
    if (!isHydrated) return;
    if (hasBackofficeAccess) return;

    clearTokens();
    document.cookie = "rifi-auth-token=; path=/; max-age=0";
    if (pathname !== "/login") {
      router.replace("/login");
    }
  }, [
    clearTokens,
    hasBackofficeAccess,
    isHydrated,
    pathname,
    router,
  ]);

  if (!isHydrated) {
    return null;
  }

  if (!hasBackofficeAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            No tienes permisos para acceder al backoffice.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
