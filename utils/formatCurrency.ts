const DEFAULT_CURRENCY = '₹';

export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyCompact(amount: number, currency: string = DEFAULT_CURRENCY): string {
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)}K`;
  return `${currency}${amount.toFixed(0)}`;
}
