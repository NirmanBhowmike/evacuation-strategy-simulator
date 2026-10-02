export class SimulationClock {
  private readonly stepSeconds: number;
  private tickCount = 0;

  constructor(stepSeconds: number) {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) {
      throw new Error("Simulation timestep must be a positive finite number.");
    }

    this.stepSeconds = stepSeconds;
  }

  get timestepSeconds(): number {
    return this.stepSeconds;
  }

  get tick(): number {
    return this.tickCount;
  }

  get timeSeconds(): number {
    return this.tickCount * this.stepSeconds;
  }

  advance(steps = 1): number {
    if (!Number.isInteger(steps) || steps <= 0) {
      throw new Error("Advance steps must be a positive integer.");
    }

    this.tickCount += steps;

    return this.timeSeconds;
  }

  reset(): void {
    this.tickCount = 0;
  }
}