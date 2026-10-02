import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import type {
  BuildingEnvironment,
} from "../../src/types/environment";
import type {
  ExitSet,
} from "../../src/types/exit";
import type {
  NavigationGraph,
} from "../../src/types/navigation";
import type {
  ScenarioInstance,
} from "../../src/types/scenario";
import type {
  SpawnZoneSet,
} from "../../src/types/spawn";

function createEnvironment():
  BuildingEnvironment {
  return {
    layoutId:
      "headless-test",

    widthMeters:
      30,

    heightMeters:
      20,

    zones: [
      {
        id:
          "room-start",

        type:
          "ROOM",

        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 4, y: 0 },
            { x: 4, y: 4 },
            { x: 0, y: 4 },
          ],
        },
      },

      {
        id:
          "corridor-a",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 4, y: 0 },
            { x: 15, y: 0 },
            { x: 15, y: 4 },
            { x: 4, y: 4 },
          ],
        },
      },

      {
        id:
          "corridor-b",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 4, y: 5 },
            { x: 20, y: 5 },
            { x: 20, y: 9 },
            { x: 4, y: 9 },
          ],
        },
      },
    ],
  };
}

function createGraph():
  NavigationGraph {
  return {
    layoutId:
      "headless-test",

    nodes: [
      {
        id:
          "start",

        type:
          "DECISION_POINT",

        position: {
          x: 4,
          y: 2,
        },

        zoneId:
          "corridor-a",
      },

      {
        id:
          "exit-a",

        type:
          "EXIT",

        position: {
          x: 9,
          y: 2,
        },

        zoneId:
          "corridor-a",
      },

      {
        id:
          "exit-b",

        type:
          "EXIT",

        position: {
          x: 12,
          y: 2,
        },

        zoneId:
          "corridor-b",
      },
    ],

    edges: [
      {
        id:
          "edge-a",

        from:
          "start",

        to:
          "exit-a",

        lengthMeters:
          5,

        widthMeters:
          2,

        zoneId:
          "corridor-a",

        bidirectional:
          true,
      },

      {
        id:
          "edge-b",

        from:
          "start",

        to:
          "exit-b",

        lengthMeters:
          8,

        widthMeters:
          2,

        zoneId:
          "corridor-b",

        bidirectional:
          true,
      },
    ],
  };
}

function createExits():
  ExitSet {
  return {
    layoutId:
      "headless-test",

    exits: [
      {
        id:
          "exit-a",

        position: {
          x: 9,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-a",
      },

      {
        id:
          "exit-b",

        position: {
          x: 12,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-b",
      },
    ],
  };
}

function createSpawnZones():
  SpawnZoneSet {
  return {
    layoutId:
      "headless-test",

    zones: [
      {
        id:
          "spawn-start",

        roomZoneId:
          "room-start",

        accessNodeId:
          "start",

        polygon: {
          vertices: [
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 3 },
            { x: 1, y: 3 },
          ],
        },
      },
    ],
  };
}

function createScenario(
  options: {
    occupantCount?: number;
    disruptionSchedule?:
      ScenarioInstance["disruptionSchedule"];
    speedMps?: number;
    id?: string;
  } = {},
): ScenarioInstance {
  const occupantCount =
    options.occupantCount ??
    1;

  return {
    id:
      options.id ??
      "headless-scenario",

    seed:
      1042,

    layoutId:
      "headless-test",

    parameterSetVersion:
      "parameter-test-v1",

    occupants:
      Array.from(
        {
          length:
            occupantCount,
        },
        (
          _,
          index,
        ) => ({
          id:
            `agent-${String(
              index + 1,
            ).padStart(
              3,
              "0",
            )}`,

          spawnPosition: {
            x:
              2,

            y:
              2,
          },

          desiredSpeedMps:
            options.speedMps ??
            1.34,
        }),
      ),

    disruptionSchedule:
      options
        .disruptionSchedule ??
      [],
  };
}

function createInput(
  scenario =
    createScenario(),
) {
  return {
    scenario,

    environment:
      createEnvironment(),

    graph:
      createGraph(),

    exits:
      createExits(),

    spawnZones:
      createSpawnZones(),

    configuration: {
      strategyId:
        "STATIC_SHORTEST_PATH" as const,

      timestepSeconds:
        0.1,

      maximumSimulationTimeSeconds:
        30,

      densityCellLengthMeters:
        1,
    },
  };
}

describe(
  "Headless simulation mode",
  () => {
    it("runs a complete evacuation without a rendering layer", () => {
      const result =
        runHeadlessSimulation(
          createInput(),
        );

      expect(
        result.termination
          .isTerminated,
      ).toBe(true);

      expect(
        result.termination
          .reason,
      ).toBe(
        "ALL_RESOLVED",
      );

      expect(
        result.metrics
          .evacuatedAgents,
      ).toBe(1);

      expect(
        result.metrics
          .completionRate,
      ).toBe(1);

      expect(
        result.finalAgents[0]
          ?.status,
      ).toBe(
        "EVACUATED",
      );

      expect(
        result.finalAgents[0]
          ?.targetExitId,
      ).toBe(
        "exit-a",
      );

      expect(
        result.decisionTrace,
      ).toHaveLength(1);
    });

    it("produces deterministic results for identical inputs", () => {
      const first =
        runHeadlessSimulation(
          createInput(),
        );

      const second =
        runHeadlessSimulation(
          createInput(),
        );

      expect(first).toEqual(
        second,
      );
    });

    it("applies a time-zero exit blockage before initial routing", () => {
      const scenario =
        createScenario({
          disruptionSchedule: [
            {
              id:
                "block-a",

              type:
                "EXIT_BLOCK",

              activationTimeSeconds:
                0,

              targetId:
                "exit-a",
            },
          ],
        });

      const result =
        runHeadlessSimulation(
          createInput(
            scenario,
          ),
        );

      expect(
        result.appliedDisruptions,
      ).toHaveLength(1);

      expect(
        result.finalAgents[0]
          ?.targetExitId,
      ).toBe(
        "exit-b",
      );

      expect(
        result.metrics
          .evacuatedAgents,
      ).toBe(1);
    });

    it("records positive queue waiting under constrained flow", () => {
      const input =
        createInput(
          createScenario({
            occupantCount:
              3,
          }),
        );

      const result =
        runHeadlessSimulation({
          ...input,

          configuration: {
            ...input.configuration,

            specificFlowPersonsPerMeterSecond:
              0.5,

            maximumSimulationTimeSeconds:
              30,
          },
        });

      expect(
        result.metrics
          .evacuatedAgents,
      ).toBe(3);

      expect(
        result.queueMetrics
          .populationQueueWaitPersonSeconds,
      ).toBeGreaterThan(
        0,
      );

      expect(
        result.queueMetrics
          .maximumQueueWaitSeconds,
      ).toBeGreaterThan(
        0,
      );
    });

    it("marks unresolved occupants TIMEOUT at the defensive time ceiling", () => {
      const input =
        createInput(
          createScenario({
            speedMps:
              0.5,
          }),
        );

      const result =
        runHeadlessSimulation({
          ...input,

          configuration: {
            ...input.configuration,

            maximumSimulationTimeSeconds:
              0.2,
          },
        });

      expect(
        result.termination
          .reason,
      ).toBe(
        "TIMEOUT",
      );

      expect(
        result.metrics
          .timeoutAgents,
      ).toBe(1);

      expect(
        result.metrics
          .evacuatedAgents,
      ).toBe(0);

      expect(
        result.finalAgents[0]
          ?.status,
      ).toBe(
        "TIMEOUT",
      );
    });

    it("does not use a future exit closure before it occurs", () => {
      const scenario =
        createScenario({
          disruptionSchedule: [
            {
              id:
                "future-block",

              type:
                "EXIT_BLOCK",

              activationTimeSeconds:
                100,

              targetId:
                "exit-a",
            },
          ],
        });

      const result =
        runHeadlessSimulation(
          createInput(
            scenario,
          ),
        );

      expect(
        result.appliedDisruptions,
      ).toEqual([]);

      expect(
        result.finalAgents[0]
          ?.targetExitId,
      ).toBe(
        "exit-a",
      );
    });

    it("rejects an occupant whose spawn position is outside every spawn zone", () => {
      const scenario:
        ScenarioInstance = {
        ...createScenario(),

        occupants: [
          {
            id:
              "agent-001",

            spawnPosition: {
              x:
                25,

              y:
                15,
            },

            desiredSpeedMps:
              1.34,
          },
        ],
      };

      expect(() =>
        runHeadlessSimulation(
          createInput(
            scenario,
          ),
        ),
      ).toThrow(
        /not inside any spawn zone/,
      );
    });
  },
);