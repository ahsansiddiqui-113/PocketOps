"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  slotId: string;
  isPro: boolean;
  /** Reserve the creative's real height up-front so the page doesn't jump when it fills (CLS). */
  minHeightClass?: string;
}

export function AdSlot({ slotId, isPro, minHeightClass = "min-h-[280px] sm:min-h-[250px]" }: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  // No slot id => nothing valid to request; avoids an AdSense error and an empty box.
  const disabled = isPro || !slotId || !clientId || clientId.includes("0000000000000000");

  const ins = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (disabled) return;
    // Request each <ins> once only (StrictMode double-runs effects in dev; AdSense errors on a repeat).
    if (ins.current?.dataset.adRequested) return;
    if (ins.current) ins.current.dataset.adRequested = "1";
    try {
      const w = window as unknown as { adsbygoogle: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // Ignore ad-blocker errors
    }
  }, [disabled]);

  if (disabled) return null;

  return (
    <div className={`my-6 block w-full overflow-hidden rounded-lg border border-border/50 bg-muted/20 ${minHeightClass}`}>
      <ins
        ref={ins}
        className="adsbygoogle block w-full"
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
