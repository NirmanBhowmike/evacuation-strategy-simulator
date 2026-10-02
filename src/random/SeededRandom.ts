export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new Error("Seed must be an integer.");
    }

    this.state = seed >>> 0;
  }

  /**
   * Returns a deterministic pseudo-random number in [0, 1).
   *
   * Implementation: Mulberry32-style 32-bit generator.
   * The algorithm is intentionally kept inside the project so that
   * experimental reproducibility does not depend on Math.random().
   */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;

    let t = this.state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns an integer in [minInclusive, maxExclusive).
   */
  nextInt(minInclusive: number, maxExclusive: number): number {
    if (!Number.isInteger(minInclusive) || !Number.isInteger(maxExclusive)) {
      throw new Error("Integer bounds are required.");
    }

    if (maxExclusive <= minInclusive) {
      throw new Error("maxExclusive must be greater than minInclusive.");
    }

    return (
      minInclusive +
      Math.floor(this.next() * (maxExclusive - minInclusive))
    );
  }
}