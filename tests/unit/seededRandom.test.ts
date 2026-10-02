import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../src/random/SeededRandom";

describe("SeededRandom", () => {
  it("produces the same sequence for the same seed", () => {
    const rngA = new SeededRandom(1042);
    const rngB = new SeededRandom(1042);

    const sequenceA = Array.from({ length: 10 }, () => rngA.next());
    const sequenceB = Array.from({ length: 10 }, () => rngB.next());

    expect(sequenceA).toEqual(sequenceB);
  });

  it("produces different sequences for different seeds", () => {
    const rngA = new SeededRandom(1042);
    const rngB = new SeededRandom(1043);

    const sequenceA = Array.from({ length: 10 }, () => rngA.next());
    const sequenceB = Array.from({ length: 10 }, () => rngB.next());

    expect(sequenceA).not.toEqual(sequenceB);
  });

  it("always produces values in the interval [0, 1)", () => {
    const rng = new SeededRandom(500);

    for (let i = 0; i < 1000; i += 1) {
      const value = rng.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("produces integers inside the requested interval", () => {
    const rng = new SeededRandom(250);

    for (let i = 0; i < 1000; i += 1) {
      const value = rng.nextInt(5, 12);

      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(12);
    }
  });

  it("rejects invalid integer ranges", () => {
    const rng = new SeededRandom(1);

    expect(() => rng.nextInt(5, 5)).toThrow();
    expect(() => rng.nextInt(8, 4)).toThrow();
  });

  it("rejects non-integer seeds", () => {
    expect(() => new SeededRandom(10.5)).toThrow();
  });
  it("preserves the reference sequence for seed 1042", () => {
  const rng = new SeededRandom(1042);

  const sequence = Array.from({ length: 5 }, () => rng.next());

  expect(sequence).toEqual([
    0.29200222180224955,
    0.44186473824083805,
    0.5415509571321309,
    0.11193503113463521,
    0.8853498001117259,
  ]);
});
});