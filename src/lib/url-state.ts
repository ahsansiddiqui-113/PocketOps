/** Mirrors calculator state into the URL (no navigation) so results are shareable. */
export function replaceQuery(params: Record<string, string | undefined>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.search = "";
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
  window.history.replaceState(null, "", url.toString());
}

export function num(value: string | string[] | undefined, fallback = 0): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number.parseFloat(raw ?? "");
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const PENDING_BUDGET_KEY = "clearledger:pending-budget";
