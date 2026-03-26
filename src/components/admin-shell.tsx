"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dumbbell,
  FileText,
  HelpCircle,
  Tag,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLogout } from "@/hooks/use-auth";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { href: "/gym-configs", label: "Gym Configs", icon: Dumbbell },
  { href: "/forms", label: "Formularios", icon: FileText },
  { href: "/questions", label: "Preguntas", icon: HelpCircle },
  { href: "/categories", label: "Categorías", icon: Tag },
  { href: "/difficulties", label: "Dificultades", icon: BarChart3 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const { isAdmin, isCompany, isKnownRole, hasValidCompanyScope } = useRoleAccess();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (!isCompany) return false;
    return item.href !== "/categories" && item.href !== "/difficulties";
  });

  const roleLabel = isAdmin ? "ADMIN" : isCompany ? "COMPANY" : "SIN ROL";

  return (
    <div className="flex h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 px-6">
          <Dumbbell className="h-6 w-6 text-green-600" />
          <span className="text-lg font-bold text-green-700">Rifi Rafi</span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-3">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-green-50 text-green-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {!isKnownRole && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              No se pudo determinar tu rol desde el token. Vuelve a iniciar sesión.
            </div>
          )}
          {isCompany && !hasValidCompanyScope && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              No se pudo extraer el company_id del token. Se restringen mutaciones por seguridad.
            </div>
          )}
        </nav>
        <Separator />
        <div className="p-3">
          {(!isKnownRole || (isCompany && !hasValidCompanyScope)) && (
            <button
              onClick={clearTokens}
              className="mb-2 flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              Limpiar sesión
            </button>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-green-700">Rifi Rafi</span>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6">{children}</main>
      </div>
    </div>
  );
}
