export interface TaxBracket {
  upToCents: number | null; // null = no upper ceiling
  rate: number; // e.g., 0.12 for 12%
}

export const TAX_PROFILES: Record<string, { label: string; brackets: TaxBracket[] }> = {
  "US-2026-SINGLE": {
    label: "US Federal Single (Illustrative Brackets)",
    brackets: [
      { upToCents: 1192500, rate: 0.1 },
      { upToCents: 4847500, rate: 0.12 },
      { upToCents: 10335000, rate: 0.22 },
      { upToCents: null, rate: 0.24 },
    ],
  },
  "FLAT-15": {
    label: "Flat 15% Effective Rate",
    brackets: [{ upToCents: null, rate: 0.15 }],
  },
};
