export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(2)}K`;
  return volume.toString();
}

export function calculateChange(current: number, previous: number): { change: number; changePercent: number } {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
  return { change, changePercent };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function isMarketHours(): boolean {
  const now = new Date();
  const npTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }));
  const hours = npTime.getHours();
  const minutes = npTime.getMinutes();
  const day = npTime.getDay();
  if (day === 0 || day === 6) return false;
  const timeInMinutes = hours * 60 + minutes;
  return timeInMinutes >= 660 && timeInMinutes <= 900; // 11:00 AM - 3:00 PM NPT
}
