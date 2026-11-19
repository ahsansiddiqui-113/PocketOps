import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="px-4">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
