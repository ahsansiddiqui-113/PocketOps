import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ClearLedger — Simple money tools",
    template: "%s | ClearLedger",
  },
  description:
    "Free budget, subscription and take-home pay calculators plus practical money guides. Save budgets and get bill reminders with Pro.",
  openGraph: { images: ["/og-default.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
