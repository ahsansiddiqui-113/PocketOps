import Link from "next/link";
import { AdScriptLoader } from "@/components/ads/AdScriptLoader";
import { getViewer } from "@/lib/viewer";

const navLink = "inline-block rounded-md px-2 py-2 hover:bg-muted";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const isPro = viewer?.isPro ?? false;

  return (
    <>
      <AdScriptLoader isPro={isPro} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="glass z-40 border-b border-border sm:sticky sm:top-0">
        <nav aria-label="Main" className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm">
          <Link href="/" className="rounded-md px-1 py-2 text-lg font-bold">ClearLedger</Link>
          <div className="flex flex-wrap items-center gap-x-1">
            <Link href="/tools/budget-splitter" className={navLink}>Budget</Link>
            <Link href="/tools/subscription-leak" className={navLink}>Subscriptions</Link>
            <Link href="/tools/take-home-pay" className={navLink}>Take-home</Link>
            <Link href="/blog" className={`${navLink} font-semibold text-primary`}>Blog</Link>
            <Link href="/pricing" className={navLink}>Pricing</Link>
            {viewer ? (
              <Link href="/dashboard" className="btn btn-primary ml-1">Dashboard</Link>
            ) : (
              <Link href="/login" className="btn ml-1">Log in</Link>
            )}
          </div>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="mt-12 border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} ClearLedger. Educational tools, not financial advice.</span>
          <span className="flex gap-4">
            <Link href="/blog">Blog</Link>
            <Link href="/legal/about">About</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
