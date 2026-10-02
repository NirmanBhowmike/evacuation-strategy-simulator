import { describe, expect, it } from "vitest";
import { SimulationClock } from "../../src/core/SimulationClock";

describe("SimulationClock", () => {
  it("starts at simulation time zero", () => {
    const clock = new SimulationClock(0.05);

    expect(clock.tick).toBe(0);
    expect(clock.timeSeconds).toBe(0);
  });

  it("advances by one fixed timestep", () => {
    const clock = new SimulationClock(0.05);

    clock.advance();

    expect(clock.tick).toBe(1);
    expect(clock.timeSeconds).toBeCloseTo(0.05);
  });

  it("advances by multiple timesteps", () => {
    const clock = new SimulationClock(0.05);

    clock.advance(20);

    expect(clock.tick).toBe(20);
    expect(clock.timeSeconds).toBeCloseTo(1.0);
  });

  it("does not accumulate timestep by repeated floating-point addition", () => {
    const clock = new SimulationClock(0.05);

    clock.advance(1000);

    expect(clock.tick).toBe(1000);
    expect(clock.timeSeconds).toBeCloseTo(50.0);
  });

  it("resets to simulation time zero", () => {
    const clock = new SimulationClock(0.05);

    clock.advance(100);
    clock.reset();

    expect(clock.tick).toBe(0);
    expect(clock.timeSeconds).toBe(0);
  });

  it("produces identical time for identical clock configurations", () => {
    const clockA = new SimulationClock(0.05);
    const clockB = new SimulationClock(0.05);

    clockA.advance(537);
    clockB.advance(537);

    expect(clockA.tick).toBe(clockB.tick);
    expect(clockA.timeSeconds).toBe(clockB.timeSeconds);
  });

  it("rejects invalid timesteps", () => {
    expect(() => new SimulationClock(0)).toThrow();
    expect(() => new SimulationClock(-0.05)).toThrow();
    expect(() => new SimulationClock(Number.NaN)).toThrow();
    expect(() => new SimulationClock(Number.POSITIVE_INFINITY)).toThrow();
  });

  it("rejects invalid advance counts", () => {
    const clock = new SimulationClock(0.05);

    expect(() => clock.advance(0)).toThrow();
    expect(() => clock.advance(-1)).toThrow();
    expect(() => clock.advance(1.5)).toThrow();
  });
});