"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/** Only allow same-site relative redirects (blocks open-redirect via ?next=). */
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) return next;
  return "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "") || email.split("@")[0];

    const res =
      mode === "register"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  const other = mode === "login" ? "/register" : "/login";
  const suffix = next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="card mx-auto mt-12 w-full max-w-sm">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Log in" : "Create your account"}</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {mode === "register" && (
          <div>
            <label htmlFor="name" className="block text-sm">Name</label>
            <input id="name" name="name" className="input mt-1" autoComplete="name" required maxLength={120} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm">Email</label>
          <input id="email" name="email" type="email" className="input mt-1" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm">Password</label>
          <input id="password" name="password" type="password" className="input mt-1" required minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <Link href={`${other}${suffix}`} className="underline">{mode === "login" ? "Create an account" : "Log in"}</Link>
      </p>
    </div>
  );
}
