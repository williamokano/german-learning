// Shared utilities for token-based widgets (GapBank, Order, Categorize).
// Click-to-place is the primary interaction. Full pointer-events drag is a v2 extension point.

/**
 * Returns an array of indices [0..length-1] in a deterministic pseudorandom order
 * derived from `seed`. Same seed always produces the same shuffle — stable across
 * page refreshes without needing to persist the order.
 */
export function seededShuffle(length: number, seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const result = Array.from({ length }, (_, i) => i);
  for (let i = result.length - 1; i > 0; i--) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
