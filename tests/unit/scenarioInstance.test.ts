import { describe, expect, it } from "vitest";
import { validateScenarioInstance } from "../../src/scenario/validateScenarioInstance";
import type { ScenarioInstance } from "../../src/types/scenario";

function createValidScenario(): ScenarioInstance {
  return {
    id: "scenario-1042",
    seed: 1042,
    layoutId: "layout-a",
    parameterSetVersion: "1.0",
    occupants: [
      {
        id: "agent-001",
        spawnPosition: { x: 2, y: 4 },
        desiredSpeedMps: 1.34,
      },
      {
        id: "agent-002",
        spawnPosition: { x: 6, y: 8 },
        desiredSpeedMps: 1.22,
      },
    ],
    disruptionSchedule: [
      {
        id: "event-001",
        type: "HAZARD_ACTIVATE",
        activationTimeSeconds: 20,
        targetId: "hazard-zone-a",
      },
      {
        id: "event-002",
        type: "EXIT_BLOCK",
        activationTimeSeconds: 40,
        targetId: "exit-east",
      },
    ],
  };
}

describe("ScenarioInstance validation", () => {
  it("accepts a valid scenario instance", () => {
    expect(() =>
      validateScenarioInstance(createValidScenario()),
    ).not.toThrow();
  });

  it("rejects duplicate occupant ids", () => {
    const scenario = createValidScenario();

    const invalidScenario: ScenarioInstance = {
      ...scenario,
      occupants: [
        ...scenario.occupants,
        {
          id: "agent-001",
          spawnPosition: { x: 10, y: 10 },
          desiredSpeedMps: 1.1,
        },
      ],
    };

    expect(() =>
      validateScenarioInstance(invalidScenario),
    ).toThrow(/Duplicate occupant id/);
  });

  it("rejects non-positive desired walking speed", () => {
    const scenario = createValidScenario();

    const invalidScenario: ScenarioInstance = {
      ...scenario,
      occupants: [
        {
          ...scenario.occupants[0]!,
          desiredSpeedMps: 0,
        },
      ],
    };

    expect(() =>
      validateScenarioInstance(invalidScenario),
    ).toThrow(/positive desired speed/);
  });

  it("rejects negative disruption times", () => {
    const scenario = createValidScenario();

    const invalidScenario: ScenarioInstance = {
      ...scenario,
      disruptionSchedule: [
        {
          id: "event-negative",
          type: "HAZARD_ACTIVATE",
          activationTimeSeconds: -1,
          targetId: "hazard-zone-a",
        },
      ],
    };

    expect(() =>
      validateScenarioInstance(invalidScenario),
    ).toThrow(/invalid activation time/);
  });

  it("rejects disruption schedules that are out of order", () => {
    const scenario = createValidScenario();

    const invalidScenario: ScenarioInstance = {
      ...scenario,
      disruptionSchedule: [
        {
          id: "event-late",
          type: "EXIT_BLOCK",
          activationTimeSeconds: 40,
          targetId: "exit-east",
        },
        {
          id: "event-early",
          type: "HAZARD_ACTIVATE",
          activationTimeSeconds: 20,
          targetId: "hazard-zone-a",
        },
      ],
    };

    expect(() =>
      validateScenarioInstance(invalidScenario),
    ).toThrow(/ordered by activation time/);
  });

  it("rejects duplicate disruption-event ids", () => {
    const scenario = createValidScenario();

    const invalidScenario: ScenarioInstance = {
      ...scenario,
      disruptionSchedule: [
        {
          id: "event-001",
          type: "HAZARD_ACTIVATE",
          activationTimeSeconds: 20,
          targetId: "hazard-zone-a",
        },
        {
          id: "event-001",
          type: "EXIT_BLOCK",
          activationTimeSeconds: 40,
          targetId: "exit-east",
        },
      ],
    };

    expect(() =>
      validateScenarioInstance(invalidScenario),
    ).toThrow(/Duplicate disruption event id/);
  });
});