import { describe, expect, it } from "vitest";
import { generateScenarioInstance } from "../../src/scenario/generateScenarioInstance";
import type { ScenarioGenerationConfig } from "../../src/types/scenarioGeneration";

function createConfig(
  seed = 1042,
): ScenarioGenerationConfig {
  return {
    id: `scenario-${seed}`,
    seed,
    layoutId: "layout-a",
    parameterSetVersion: "1.0",
    occupantCount: 4,
    spawnPositions: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
      { x: 5, y: 5 },
      { x: 6, y: 6 },
    ],
    walkingSpeed: {
      mean: 1.34,
      standardDeviation: 0.26,
      min: 0.6,
      max: 2.1,
    },
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

describe("generateScenarioInstance", () => {
  it("produces identical scenarios from identical configuration and seed", () => {
    const scenarioA = generateScenarioInstance(
      createConfig(1042),
    );

    const scenarioB = generateScenarioInstance(
      createConfig(1042),
    );

    expect(scenarioA).toEqual(scenarioB);
  });

  it("produces different stochastic populations for different seeds", () => {
    const scenarioA = generateScenarioInstance(
      createConfig(1042),
    );

    const scenarioB = generateScenarioInstance(
      createConfig(1043),
    );

    expect(scenarioA.occupants).not.toEqual(
      scenarioB.occupants,
    );
  });

  it("creates the requested number of occupants with deterministic ids", () => {
    const scenario = generateScenarioInstance(
      createConfig(),
    );

    expect(scenario.occupants).toHaveLength(4);

    expect(scenario.occupants.map((occupant) => occupant.id)).toEqual([
      "agent-001",
      "agent-002",
      "agent-003",
      "agent-004",
    ]);
  });

  it("keeps generated walking speeds inside configured bounds", () => {
    const scenario = generateScenarioInstance(
      createConfig(),
    );

    for (const occupant of scenario.occupants) {
      expect(occupant.desiredSpeedMps).toBeGreaterThanOrEqual(
        0.6,
      );

      expect(occupant.desiredSpeedMps).toBeLessThanOrEqual(
        2.1,
      );
    }
  });

  it("assigns unique supplied spawn positions", () => {
    const scenario = generateScenarioInstance(
      createConfig(),
    );

    const serializedPositions = scenario.occupants.map(
      (occupant) =>
        `${occupant.spawnPosition.x},${occupant.spawnPosition.y}`,
    );

    expect(new Set(serializedPositions).size).toBe(
      scenario.occupants.length,
    );
  });

  it("rejects occupant counts larger than the available spawn positions", () => {
    const config = createConfig();

    expect(() =>
      generateScenarioInstance({
        ...config,
        occupantCount: 100,
      }),
    ).toThrow(/cannot exceed/);
  });

  it("rejects non-positive occupant counts", () => {
    const config = createConfig();

    expect(() =>
      generateScenarioInstance({
        ...config,
        occupantCount: 0,
      }),
    ).toThrow(/positive integer/);
  });

  it("does not mutate the supplied spawn-position array", () => {
    const config = createConfig();

    const before = JSON.stringify(config.spawnPositions);

    generateScenarioInstance(config);

    expect(JSON.stringify(config.spawnPositions)).toBe(
      before,
    );
  });
});