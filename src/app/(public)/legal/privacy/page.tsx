import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <div className="prose-lite mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p><em>Template draft — have this reviewed by counsel before launch.</em></p>
      <h2>What we collect</h2>
      <p>Account details (name, email), the budgets and bills you choose to save, and basic usage data. Calculator inputs on public tools stay in your browser and the page URL unless you save them.</p>
      <h2>Advertising</h2>
      <p>Free visitors see ads served by Google AdSense, which may use cookies to personalise ads. Pro subscribers see no ads and load no ad scripts. You can manage ad personalisation in Google&apos;s ad settings.</p>
      <h2>Payments</h2>
      <p>Payments are handled by our merchant of record. We never see or store your card details.</p>
      <h2>Your rights</h2>
      <p>You can export or delete your data at any time by contacting us.</p>
    </div>
  );
}
