export type UserPlan = "free" | "pro";

export const PLAN_LIMITS = {
  free: {
    maxSavedBudgets: 1,
    maxRecurringBills: 3,
    canExportReports: false,
    canReceiveEmailReminders: false,
    canReadPremiumArticles: false,
    showAds: true,
  },
  pro: {
    maxSavedBudgets: Number.POSITIVE_INFINITY,
    maxRecurringBills: Number.POSITIVE_INFINITY,
    canExportReports: true,
    canReceiveEmailReminders: true,
    canReadPremiumArticles: true,
    showAds: false,
  },
} as const;

export function isProPlan(plan?: string | null): boolean {
  return plan === "pro";
}
