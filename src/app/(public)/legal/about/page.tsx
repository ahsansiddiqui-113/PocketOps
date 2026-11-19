import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return (
    <div className="prose-lite mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">About ClearLedger</h1>
      <p>ClearLedger makes everyday money decisions easier with fast, no-login calculators and plain-English guides. The tools are free and supported by ads; Pro removes the ads and adds saved budgets, bill reminders and exports.</p>
    </div>
  );
}
