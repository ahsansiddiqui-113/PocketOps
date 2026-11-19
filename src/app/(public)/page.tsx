import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { HeroScene } from "@/components/three/HeroScene";
import { TiltCard } from "@/components/ui/TiltCard";
import { getAllPostsMeta } from "@/lib/mdx";
import { getViewer } from "@/lib/viewer";

const TOOLS = [
  { href: "/tools/budget-splitter", title: "Budget Splitter", blurb: "See where every paycheck goes and spot overspending before it happens.", accent: "var(--b-need)", stat: "4 buckets" },
  { href: "/tools/subscription-leak", title: "Subscription Leak Finder", blurb: "Add up recurring charges and see what they cost over 10 years.", accent: "var(--b-want)", stat: "10-yr view" },
  { href: "/tools/take-home-pay", title: "Take-Home Pay", blurb: "Estimate net pay from gross salary, deductions and tax brackets.", accent: "var(--b-saving)", stat: "Net in seconds" },
];

const STEPS = [
  { n: "1", title: "Enter your numbers", text: "No account needed. Your inputs live in the link." },
  { n: "2", title: "See it in blocks", text: "Needs, wants, savings and debt, sized to your income." },
  { n: "3", title: "Save and stay on track", text: "Create a free account to keep budgets; go Pro for reminders." },
];

/** Tinted pill with foreground text: readable in both themes (white-on-pastel failed contrast). */
const pill = (accent: string): React.CSSProperties => ({
  background: `color-mix(in srgb, ${accent} 16%, var(--card))`,
  border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
});

export default async function HomePage() {
  const viewer = await getViewer();
  const posts = getAllPostsMeta();
  const [featured, ...rest] = posts;

  return (
    <div>
      <section className="grid items-center gap-8 py-4 lg:grid-cols-2 lg:py-10">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-primary" /> Free calculators · no sign-up
          </p>
          <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">
            Your money, <span className="text-primary">in solid blocks.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Clear, fast calculators for the questions you actually Google. Split a paycheck, find subscription leaks, know your real take-home.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tools/budget-splitter" className="btn btn-primary px-5 py-3 text-base">Split my budget</Link>
            <Link href="/blog" className="btn px-5 py-3 text-base">Read the blog</Link>
          </div>
        </div>
        <HeroScene />
      </section>

      <section aria-labelledby="tools-h" className="mt-8">
        <h2 id="tools-h" className="mb-4 text-2xl font-semibold">Pick a tool</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TOOLS.map((t) => (
            <TiltCard key={t.href} href={t.href} accent={t.accent}>
              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={pill(t.accent)}>{t.stat}</span>
              <h3 className="mt-3 text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
              <p className="mt-4 text-sm font-medium">Open tool <span aria-hidden style={{ color: t.accent }}>→</span></p>
            </TiltCard>
          ))}
        </div>
      </section>

      {featured && (
        <section id="blog" aria-labelledby="blog-h" className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="blog-h" className="text-2xl font-semibold">From the blog</h2>
            <Link href="/blog" className="text-sm font-medium text-primary underline-offset-4 hover:underline">All posts →</Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Link href={`/blog/${featured.slug}`} className="card block lg:col-span-3" style={{ borderColor: "color-mix(in srgb, var(--primary) 40%, var(--border))" }}>
              <p className="text-xs text-muted-foreground">
                Latest · {featured.category}
                {featured.isPremium && <span className="ml-2 rounded bg-muted px-2 py-0.5">Pro</span>}
              </p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight">{featured.title}</h3>
              <p className="mt-2 text-muted-foreground">{featured.excerpt}</p>
              <p className="mt-4 text-sm font-medium text-primary">Read the guide →</p>
            </Link>
            <ul className="grid gap-4 lg:col-span-2">
              {rest.slice(0, 3).map((p) => (
                <li key={p.slug}>
                  <Link href={`/blog/${p.slug}`} className="card block h-full hover:bg-muted">
                    <p className="text-xs text-muted-foreground">
                      {p.category}
                      {p.isPremium && <span className="ml-2 rounded bg-muted px-2 py-0.5">Pro</span>}
                    </p>
                    <h3 className="mt-1 font-semibold leading-snug">{p.title}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <AdSlot slotId={process.env.NEXT_PUBLIC_AD_SLOT_BANNER ?? ""} isPro={viewer?.isPro ?? false} minHeightClass="min-h-[280px] sm:min-h-[120px]" />

      <section aria-labelledby="how-h" className="mt-10">
        <h2 id="how-h" className="mb-4 text-2xl font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {!viewer?.isPro && (
        <section className="card mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Go Pro for $4/month</h2>
            <p className="text-sm text-muted-foreground">Unlimited budgets and bills, email reminders, CSV export, no ads.</p>
          </div>
          <Link href="/pricing" className="btn btn-primary">Compare plans</Link>
        </section>
      )}
    </div>
  );
}
