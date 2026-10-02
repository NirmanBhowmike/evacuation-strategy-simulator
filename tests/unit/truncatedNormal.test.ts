import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../src/random/SeededRandom";
import { sampleTruncatedNormal } from "../../src/random/sampleTruncatedNormal";

const parameters = {
  mean: 1.34,
  standardDeviation: 0.26,
  min: 0.6,
  max: 2.1,
} as const;

describe("sampleTruncatedNormal", () => {
  it("produces identical samples for identical seeds", () => {
    const rngA = new SeededRandom(1042);
    const rngB = new SeededRandom(1042);

    const samplesA = Array.from({ length: 20 }, () =>
      sampleTruncatedNormal(rngA, parameters),
    );

    const samplesB = Array.from({ length: 20 }, () =>
      sampleTruncatedNormal(rngB, parameters),
    );

    expect(samplesA).toEqual(samplesB);
  });

  it("produces different samples for different seeds", () => {
    const rngA = new SeededRandom(1042);
    const rngB = new SeededRandom(1043);

    const samplesA = Array.from({ length: 20 }, () =>
      sampleTruncatedNormal(rngA, parameters),
    );

    const samplesB = Array.from({ length: 20 }, () =>
      sampleTruncatedNormal(rngB, parameters),
    );

    expect(samplesA).not.toEqual(samplesB);
  });

  it("keeps all samples inside the requested bounds", () => {
    const rng = new SeededRandom(500);

    for (let i = 0; i < 5000; i += 1) {
      const value = sampleTruncatedNormal(rng, parameters);

      expect(value).toBeGreaterThanOrEqual(parameters.min);
      expect(value).toBeLessThanOrEqual(parameters.max);
    }
  });

  it("produces a sample mean reasonably close to the configured mean", () => {
    const rng = new SeededRandom(2500);

    const samples = Array.from({ length: 20_000 }, () =>
      sampleTruncatedNormal(rng, parameters),
    );

    const sampleMean =
      samples.reduce((sum, value) => sum + value, 0) /
      samples.length;

    expect(sampleMean).toBeCloseTo(parameters.mean, 1);
  });

  it("rejects a non-positive standard deviation", () => {
    const rng = new SeededRandom(1);

    expect(() =>
      sampleTruncatedNormal(rng, {
        ...parameters,
        standardDeviation: 0,
      }),
    ).toThrow(/Standard deviation/);
  });

  it("rejects invalid truncation bounds", () => {
    const rng = new SeededRandom(1);

    expect(() =>
      sampleTruncatedNormal(rng, {
        ...parameters,
        min: 2,
        max: 1,
      }),
    ).toThrow(/bounds/);
  });

  it("fails explicitly when valid sampling is not achieved", () => {
    const rng = new SeededRandom(1);

    expect(() =>
      sampleTruncatedNormal(rng, {
        mean: 100,
        standardDeviation: 0.01,
        min: 0.6,
        max: 2.1,
        maxAttempts: 5,
      }),
    ).toThrow(/Unable to sample/);
  });
});