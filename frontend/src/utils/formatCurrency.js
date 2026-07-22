/**
 * Format number to Vietnamese Currency string
 * Example: 50000 -> 50,000 đ
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
}

/**
 * Format short amount for calendar badges
 * Example: 1500000 -> 1.5M, 250000 -> 250k
 */
export function formatShortCurrency(amount) {
  const num = Math.abs(Number(amount) || 0);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1000) {
    return Math.round(num / 1000) + 'k';
  }
  return num + '';
}
