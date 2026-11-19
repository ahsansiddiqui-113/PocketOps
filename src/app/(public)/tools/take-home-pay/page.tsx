import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { TakeHomePay } from "@/components/calculators/TakeHomePay";
import { num } from "@/lib/url-state";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Take-Home Pay Calculator",
  description: "Estimate your net monthly and annual pay from gross salary and pre-tax deductions.",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  const profile = Array.isArray(sp.profile) ? sp.profile[0] : sp.profile;

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Take-Home Pay Calculator</h1>
      <p className="mb-5 text-muted-foreground">See how progressive tax brackets turn gross salary into net pay.</p>
      <TakeHomePay
        currencyCode={viewer?.currencyCode}
        initial={{ gross: num(sp.gross), deductions: num(sp.deductions), profile: profile ?? "US-2026-SINGLE" }}
      />
      <AdSlot slotId={process.env.NEXT_PUBLIC_AD_SLOT_BANNER ?? ""} isPro={viewer?.isPro ?? false} />
    </div>
  );
}
