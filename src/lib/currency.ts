export function dollarsToCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function centsToDollars(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return Math.round(cents) / 100;
}

export function formatMoneyFromCents(
  cents: number,
  currencyCode = "USD",
  locale = "en-US"
): string {
  const safeCents = Number.isFinite(cents) ? Math.round(cents) : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(safeCents / 100);
}
