"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBudgetAction } from "@/actions/budget.actions";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { PENDING_BUDGET_KEY } from "@/lib/url-state";

/** Imports a budget stashed in sessionStorage before sign-up, then clears it. */
export function PendingBudgetImporter() {
  const router = useRouter();
  const ran = useRef(false);
  const [paywall, setPaywall] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PENDING_BUDGET_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    (async () => {
      try {
        const res = await createBudgetAction(JSON.parse(raw!));
        if (res.ok) {
          setNotice("Your budget from the calculator was saved.");
          router.refresh();
        } else if (res.code === "UPGRADE_REQUIRED") {
          setPaywall(res.reason);
        } else if (res.code === "INVALID_INPUT") {
          setNotice("We couldn't import your saved calculator budget.");
        }
      } catch {
        setNotice("We couldn't import your saved calculator budget.");
      } finally {
        try {
          sessionStorage.removeItem(PENDING_BUDGET_KEY);
        } catch {
          /* ignore */
        }
      }
    })();
  }, [router]);

  return (
    <>
      {notice && <p role="status" className="card mb-4 text-sm">{notice}</p>}
      <PaywallModal open={paywall !== null} reason={paywall ?? undefined} onClose={() => setPaywall(null)} />
    </>
  );
}
