import { SeededRandom } from "./SeededRandom";

export interface TruncatedNormalParameters {
  readonly mean: number;
  readonly standardDeviation: number;
  readonly min: number;
  readonly max: number;
  readonly maxAttempts?: number;
}

export function sampleTruncatedNormal(
  rng: SeededRandom,
  parameters: TruncatedNormalParameters,
): number {
  const {
    mean,
    standardDeviation,
    min,
    max,
    maxAttempts = 10_000,
  } = parameters;

  if (!Number.isFinite(mean)) {
    throw new Error("Mean must be finite.");
  }

  if (
    !Number.isFinite(standardDeviation) ||
    standardDeviation <= 0
  ) {
    throw new Error(
      "Standard deviation must be a positive finite number.",
    );
  }

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    throw new Error("Truncation bounds are invalid.");
  }

  if (!Number.isInteger(maxAttempts) || maxAttempts <= 0) {
    throw new Error("maxAttempts must be a positive integer.");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    // Box-Muller transform.
    const u1 = 1 - rng.next();
    const u2 = rng.next();

    const z =
      Math.sqrt(-2 * Math.log(u1)) *
      Math.cos(2 * Math.PI * u2);

    const value = mean + standardDeviation * z;

    if (value >= min && value <= max) {
      return value;
    }
  }

  throw new Error(
    "Unable to sample a value within the requested bounds.",
  );
}