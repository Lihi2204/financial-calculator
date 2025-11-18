export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(num: number): string {
  return '$' + formatNumber(num, 2);
}
