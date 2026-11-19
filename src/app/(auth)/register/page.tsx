import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function RegisterPage() {
  return (
    <main className="px-4">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
