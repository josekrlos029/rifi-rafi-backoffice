import { AdminShell } from "@/components/admin-shell";
import { BackofficeGuard } from "@/components/backoffice-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackofficeGuard>
      <AdminShell>{children}</AdminShell>
    </BackofficeGuard>
  );
}
