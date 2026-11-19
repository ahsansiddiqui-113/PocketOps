import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { getAllPostsMeta } from "@/lib/mdx";
import { getViewer } from "@/lib/viewer";

const TOOLS = [
  { href: "/tools/budget-splitter", title: "Budget Splitter", blurb: "See where every paycheck goes and spot overspending." },
  { href: "/tools/subscription-leak", title: "Subscription Leak Finder", blurb: "Add up what recurring charges really cost over 10 years." },
  { href: "/tools/take-home-pay", title: "Take-Home Pay", blurb: "Estimate net pay from gross salary and deductions." },
];

export default async function HomePage() {
  const viewer = await getViewer();
  const posts = getAllPostsMeta().slice(0, 3);

  return (
    <div>
      <section className="py-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Money clarity in under a minute</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Free calculators for everyday money questions. No sign-up needed. Save budgets and get bill reminders when you want more.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card transition hover:bg-muted">
            <h2 className="font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
          </Link>
        ))}
      </section>

      <AdSlot slotId={process.env.NEXT_PUBLIC_AD_SLOT_BANNER ?? ""} isPro={viewer?.isPro ?? false} minHeightClass="min-h-[120px]" />

      {posts.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-semibold">Latest guides</h2>
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="font-medium underline">{p.title}</Link>
                {p.isPremium && <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">Pro</span>}
                <p className="text-sm text-muted-foreground">{p.excerpt}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
