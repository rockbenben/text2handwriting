/**
 * Deterministic pseudo-random number generator using Mulberry32 algorithm.
 * Supports uniform ranges and Gaussian (normal) distribution for natural jitter.
 */
export class SeededRandom {
  private s: number;

  constructor(seed: number) {
    this.s = Math.floor(seed) >>> 0;
    if (this.s === 0) this.s = 1;
  }

  /**
   * Generates a float in [0, 1)
   */
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  random(): number {
    return this.next();
  }

  /**
   * Generates a float in [min, max]
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generates an integer in [min, max]
   */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Generates a Gaussian distributed number with Box-Muller transform
   */
  gaussian(mean = 0, stdDev = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    // Avoid log(0)
    while (u1 <= 1e-7) {
      u1 = this.next();
    }
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}
