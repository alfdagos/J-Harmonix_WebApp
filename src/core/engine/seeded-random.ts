/**
 * Mulberry32 seeded PRNG. Provides a nextInt(n) method equivalent to
 * Java's Random.nextInt(n) — returns an integer in [0, n).
 */
export interface SeededRandom {
  nextInt(n: number): number;
}

export function createSeededRandom(seed: number): SeededRandom {
  // Ensure 32-bit unsigned; avoid all-zero state
  let s = (seed >>> 0) || 1;

  function next(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let z = Math.imul(s ^ (s >>> 15), s | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  return {
    nextInt(n: number): number {
      return Math.floor(next() * n);
    },
  };
}
