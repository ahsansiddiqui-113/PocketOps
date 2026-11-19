import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { BudgetSplitter } from "@/components/calculators/BudgetSplitter";
import { num } from "@/lib/url-state";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Budget Splitter Calculator",
  description: "Split your monthly income across needs, wants, savings and debt and see instantly if your budget is healthy.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const viewer = await getViewer();

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Budget Splitter</h1>
      <p className="mb-5 text-muted-foreground">Enter your take-home income and how you plan to spend it. Your numbers live in the link, so you can share them.</p>
      <BudgetSplitter
        isAuthed={Boolean(viewer)}
        currencyCode={viewer?.currencyCode}
        initial={{ income: num(sp.income), need: num(sp.need), want: num(sp.want), saving: num(sp.saving), debt: num(sp.debt) }}
      />
      <AdSlot slotId={process.env.NEXT_PUBLIC_AD_SLOT_BANNER ?? ""} isPro={viewer?.isPro ?? false} />
    </div>
  );
}
