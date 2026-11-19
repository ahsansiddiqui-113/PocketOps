import Link from "next/link";
import { AdScriptLoader } from "@/components/ads/AdScriptLoader";
import { getViewer } from "@/lib/viewer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const isPro = viewer?.isPro ?? false;

  return (
    <>
      <AdScriptLoader isPro={isPro} />
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 text-sm">
          <Link href="/" className="text-lg font-bold">ClearLedger</Link>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/tools/budget-splitter">Budget</Link>
            <Link href="/tools/subscription-leak">Subscriptions</Link>
            <Link href="/tools/take-home-pay">Take-home</Link>
            <Link href="/blog">Guides</Link>
            <Link href="/pricing">Pricing</Link>
            {viewer ? (
              <Link href="/dashboard" className="btn btn-primary">Dashboard</Link>
            ) : (
              <Link href="/login" className="btn">Log in</Link>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mt-12 border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} ClearLedger. Educational tools, not financial advice.</span>
          <span className="flex gap-4">
            <Link href="/legal/about">About</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
