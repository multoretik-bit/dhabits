/**
 * Format coins to display with appropriate decimal places
 */
export function formatCoins(coins: number | undefined | null): string {
  if (!coins && coins !== 0) return "0";
  const num = typeof coins === "number" ? coins : 0;
  if (num === Math.floor(num)) {
    return num.toFixed(0);
  } else if (num === Math.floor(num * 10) / 10) {
    return num.toFixed(1);
  } else {
    return num.toFixed(2);
  }
}

export function roundCoins(coins: number): number {
  return Math.round(coins * 100) / 100;
}

export function addCoins(current: number, toAdd: number): number {
  return roundCoins(current + toAdd);
}
