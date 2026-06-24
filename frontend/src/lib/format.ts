export function formatPrice(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPriceCompact(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatPercent(value: number, digits = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export function formatQty(value: number): string {
  return value.toLocaleString('en-IN');
}

export const priceClass = 'font-mono tabular-nums';
