/**
 * Four colored columns whose height tracks each bucket's share of income.
 * Decorative (aria-hidden); every number is also shown as text elsewhere.
 * The bar's % height resolves against a label-free box, so heights stay proportional.
 */
const COLS = [
  { key: "need", label: "Needs", color: "var(--b-need)" },
  { key: "want", label: "Wants", color: "var(--b-want)" },
  { key: "saving", label: "Savings", color: "var(--b-saving)" },
  { key: "debt", label: "Debt", color: "var(--b-debt)" },
] as const;

export function BucketBlocks({ percents }: { percents: Record<"need" | "want" | "saving" | "debt", number> }) {
  const empty = COLS.every((c) => !percents[c.key]);
  return (
    <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4" aria-hidden>
      <div className="grid grid-cols-4 gap-3 sm:gap-5">
        {COLS.map((c) => {
          const pct = Math.max(0, Math.min(100, Math.round(percents[c.key])));
          return (
            <div key={c.key} className="flex h-40 flex-col">
              <div className="flex min-h-0 flex-1 items-end justify-center border-b border-border/70">
                {pct > 0 && (
                  <div
                    className="bucket-col shrink-0"
                    style={{ height: `${Math.max(pct, 6)}%`, ["--c" as string]: c.color }}
                  />
                )}
              </div>
              <p className="mt-2 text-center text-sm font-semibold leading-none">{pct}%</p>
              <p className="mt-1 text-center text-xs text-muted-foreground">{c.label}</p>
            </div>
          );
        })}
      </div>
      {empty && <p className="mt-3 text-center text-xs text-muted-foreground">Enter income and amounts to see your blocks.</p>}
    </div>
  );
}
