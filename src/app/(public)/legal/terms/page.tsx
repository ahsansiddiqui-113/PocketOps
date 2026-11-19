import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Page() {
  return (
    <div className="prose-lite mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p><em>Template draft — have this reviewed by counsel before launch.</em></p>
      <h2>Not financial advice</h2>
      <p>ClearLedger provides educational calculators and guides. Results are estimates and are not financial, tax or legal advice.</p>
      <h2>Subscriptions</h2>
      <p>Pro is billed monthly or yearly and renews until cancelled. When you cancel, Pro stays active until the end of the paid period.</p>
      <h2>Acceptable use</h2>
      <p>Don&apos;t abuse the service, attempt to bypass plan limits, or scrape premium content.</p>
    </div>
  );
}
