import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { getViewer } from "@/lib/viewer";

// Intentionally NO AdScriptLoader / AdSlot anywhere under /dashboard.
export const metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/dashboard");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/" className="text-lg font-bold">ClearLedger</Link>
          <Link href="/dashboard">Overview</Link>
          <Link href="/dashboard/budgets">Budgets</Link>
          <Link href="/dashboard/bills">Bills</Link>
          <Link href="/dashboard/billing">Billing</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded bg-muted px-2 py-0.5 text-xs uppercase">{viewer.plan}</span>
          <span className="text-muted-foreground">{viewer.email}</span>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
