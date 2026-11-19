"use client";

import { useState, useTransition } from "react";
import { exportDataCsvAction } from "@/actions/export.actions";
import { PaywallModal } from "@/components/paywall/PaywallModal";

export function ExportButton() {
  const [pending, start] = useTransition();
  const [paywall, setPaywall] = useState<string | null>(null);

  return (
    <>
      <button
        className="btn"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await exportDataCsvAction();
            if (!res.ok) {
              if (res.code === "UPGRADE_REQUIRED") setPaywall(res.reason);
              return;
            }
            const url = URL.createObjectURL(new Blob([res.csv], { type: "text/csv;charset=utf-8" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = res.filename;
            a.click();
            URL.revokeObjectURL(url);
          })
        }
      >
        Export CSV
      </button>
      <PaywallModal open={paywall !== null} reason={paywall ?? undefined} onClose={() => setPaywall(null)} />
    </>
  );
}
