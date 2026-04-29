/**
 * Fibonacci Retracement implementation
 */

export interface FibonacciLevel {
  level: number;
  price: number;
  label: string;
}

const FIBONACCI_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function calculateFibonacciRetracement(
  high: number,
  low: number,
  isUptrend = true
): FibonacciLevel[] {
  const range = high - low;

  return FIBONACCI_LEVELS.map((level) => ({
    level,
    price: isUptrend ? high - range * level : low + range * level,
    label: `${(level * 100).toFixed(1)}%`,
  }));
}

export function calculateFibonacciExtension(
  high: number,
  low: number,
  retracePoint: number
): FibonacciLevel[] {
  const range = high - low;
  const extensionLevels = [0, 0.618, 1, 1.272, 1.618, 2, 2.618];

  return extensionLevels.map((level) => ({
    level,
    price: retracePoint + range * level,
    label: `${(level * 100).toFixed(1)}%`,
  }));
}
