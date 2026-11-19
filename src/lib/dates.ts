export type Cycle = "weekly" | "monthly" | "quarterly" | "yearly";

const MONTHS: Record<Exclude<Cycle, "weekly">, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** True only for real calendar dates ('2026-02-31' is rejected). */
export function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

function addMonthsClamped(y: number, m0: number, anchorDay: number, months: number): string {
  const total = y * 12 + m0 + months;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const dim = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const day = Math.min(anchorDay, dim);
  return `${String(ny).padStart(4, "0")}-${String(nm + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The date `k` whole cycles after `dueDate`, always computed from the original (no drift). */
export function addCycles(dueDate: string, cycle: Cycle, k: number, anchorDay?: number | null): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  if (cycle === "weekly") {
    const t = Date.UTC(y, m - 1, d) + k * 7 * 86_400_000;
    return new Date(t).toISOString().slice(0, 10);
  }
  return addMonthsClamped(y, m - 1, anchorDay ?? d, k * MONTHS[cycle]);
}

/** First occurrence strictly on/after `today`, skipping every missed cycle in one step. */
export function rollForward(dueDate: string, cycle: Cycle, today: string, anchorDay?: number | null): string {
  if (dueDate >= today) return dueDate;
  for (let k = 1; k <= 5000; k++) {
    const next = addCycles(dueDate, cycle, k, anchorDay);
    if (next >= today) return next;
  }
  return dueDate;
}
