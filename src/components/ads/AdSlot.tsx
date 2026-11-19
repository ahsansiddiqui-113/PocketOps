"use client";

import { useEffect } from "react";

interface AdSlotProps {
  slotId: string;
  isPro: boolean;
  minHeightClass?: string;
}

export function AdSlot({ slotId, isPro, minHeightClass = "min-h-[250px]" }: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const disabled = isPro || !clientId || clientId.includes("0000000000000000");

  useEffect(() => {
    if (disabled) return;
    try {
      const w = window as unknown as { adsbygoogle: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // Ignore ad-blocker errors
    }
  }, [disabled]);

  // Pro users get nothing; unconfigured placeholder IDs render nothing too, so no
  // empty reserved box shows up in dev.
  if (disabled) return null;

  return (
    <aside
      aria-label="Sponsored"
      className={`my-6 flex w-full items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted/20 ${minHeightClass}`}
    >
      <ins
        className="adsbygoogle block w-full"
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
