import {
  describe,
  expect,
  it,
} from "vitest";

import {
  findShortestPathDijkstra,
} from "../../src/core/dijkstra";
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
      "validation-layout",

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
      "validation-layout",

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
      "validation-layout",

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
      "validation-layout",

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
    id?: string;

    seed?: number;

    occupantCount?: number;

    disruptionSchedule?:
      ScenarioInstance["disruptionSchedule"];
  } = {},
): ScenarioInstance {
  const occupantCount =
    options.occupantCount ??
    1;

  return {
    id:
      options.id ??
      "validation-scenario",

    seed:
      options.seed ??
      1042,

    layoutId:
      "validation-layout",

    parameterSetVersion:
      "validation-v1",

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
            x: 2,
            y: 2,
          },

          desiredSpeedMps:
            1.34,
        }),
      ),

    disruptionSchedule:
      options
        .disruptionSchedule ??
      [],
  };
}

function createSimulationInput(
  scenario:
    ScenarioInstance =
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

      /**
       * A large density-cell length makes the single-agent
       * analytical case effectively free-flow while still
       * exercising the real density/congestion implementation.
       */
      densityCellLengthMeters:
        100,

      /**
       * High synthetic capacity removes queue delay from the
       * analytical walking-time validation.
       */
      specificFlowPersonsPerMeterSecond:
        100,
    },
  };
}

describe(
  "Phase 5 core engine validation",
  () => {
    it("matches the analytical single-agent travel-time expectation within timestep resolution", () => {
      const result =
        runHeadlessSimulation(
          createSimulationInput(),
        );

      /**
       * Analytical free-flow time:
       *
       * 5 m / 1.34 m/s
       * = approximately 3.7313 s
       *
       * With a fixed 0.1 s timestep, evacuation should be
       * recorded on the first timestep boundary at or after the
       * analytical arrival time:
       *
       * ceil(3.7313 / 0.1) * 0.1
       * = 3.8 s
       */
      const analyticalTime =
        5 / 1.34;

      const expectedDiscreteTime =
        Math.ceil(
          analyticalTime /
            0.1,
        ) * 0.1;

      expect(
        analyticalTime,
      ).toBeCloseTo(
        3.7313432836,
      );

      expect(
        result.metrics
          .totalEvacuationTimeSeconds,
      ).toBeCloseTo(
        expectedDiscreteTime,
        10,
      );

      expect(
        result.metrics
          .meanTravelDistanceMeters,
      ).toBeCloseTo(
        5,
        10,
      );

      expect(
        result.metrics
          .evacuatedAgents,
      ).toBe(1);

      expect(
        result.metrics
          .completionRate,
      ).toBe(1);
    });

    it("matches a known shortest-path reference solution", () => {
      const graph:
        NavigationGraph = {
        layoutId:
          "reference-graph",

        nodes: [
          {
            id: "a",
            type:
              "JUNCTION",

            position: {
              x: 0,
              y: 0,
            },

            zoneId:
              "zone",
          },

          {
            id: "b",
            type:
              "JUNCTION",

            position: {
              x: 1,
              y: 0,
            },

            zoneId:
              "zone",
          },

          {
            id: "c",
            type:
              "JUNCTION",

            position: {
              x: 2,
              y: 0,
            },

            zoneId:
              "zone",
          },

          {
            id: "exit",
            type:
              "EXIT",

            position: {
              x: 3,
              y: 0,
            },

            zoneId:
              "zone",
          },
        ],

        edges: [
          {
            id:
              "direct",

            from: "a",
            to: "exit",

            lengthMeters:
              10,

            widthMeters:
              2,

            zoneId:
              "zone",

            bidirectional:
              true,
          },

          {
            id:
              "a-b",

            from: "a",
            to: "b",

            lengthMeters:
              1,

            widthMeters:
              2,

            zoneId:
              "zone",

            bidirectional:
              true,
          },

          {
            id:
              "b-c",

            from: "b",
            to: "c",

            lengthMeters:
              2,

            widthMeters:
              2,

            zoneId:
              "zone",

            bidirectional:
              true,
          },

          {
            id:
              "c-exit",

            from: "c",
            to: "exit",

            lengthMeters:
              1,

            widthMeters:
              2,

            zoneId:
              "zone",

            bidirectional:
              true,
          },
        ],
      };

      const result =
        findShortestPathDijkstra(
          graph,
          "a",
          [
            "exit",
          ],
        );

      expect(
        result,
      ).not.toBeNull();

      expect(
        result?.nodeIds,
      ).toEqual([
        "a",
        "b",
        "c",
        "exit",
      ]);

      expect(
        result?.edgeIds,
      ).toEqual([
        "a-b",
        "b-c",
        "c-exit",
      ]);

      expect(
        result?.totalCost,
      ).toBe(4);
    });

    it("removes a blocked corridor from the integrated routing solution", () => {
      const scenario =
        createScenario({
          id:
            "blocked-edge-validation",

          disruptionSchedule: [
            {
              id:
                "block-short-route",

              type:
                "CORRIDOR_BLOCK",

              activationTimeSeconds:
                0,

              targetId:
                "corridor-a",
            },
          ],
        });

      const result =
        runHeadlessSimulation(
          createSimulationInput(
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
        result.finalAgents[0]
          ?.status,
      ).toBe(
        "EVACUATED",
      );

      expect(
        result.metrics
          .completionRate,
      ).toBe(1);
    });

    it("classifies an occupant as UNREACHABLE when every route to an available exit is blocked", () => {
      const scenario =
        createScenario({
          id:
            "unreachable-validation",

          disruptionSchedule: [
            {
              id:
                "block-route-a",

              type:
                "CORRIDOR_BLOCK",

              activationTimeSeconds:
                0,

              targetId:
                "corridor-a",
            },

            {
              id:
                "block-route-b",

              type:
                "CORRIDOR_BLOCK",

              activationTimeSeconds:
                0,

              targetId:
                "corridor-b",
            },
          ],
        });

      const result =
        runHeadlessSimulation(
          createSimulationInput(
            scenario,
          ),
        );

      expect(
        result.termination
          .reason,
      ).toBe(
        "ALL_RESOLVED",
      );

      expect(
        result.metrics
          .unreachableAgents,
      ).toBe(1);

      expect(
        result.metrics
          .evacuatedAgents,
      ).toBe(0);

      expect(
        result.metrics
          .completionRate,
      ).toBe(0);

      expect(
        result.finalAgents[0]
          ?.status,
      ).toBe(
        "UNREACHABLE",
      );

      expect(
        result.simulatedTimeSeconds,
      ).toBe(0);
    });

    it("reproduces exactly when the same seeded scenario and parameters are replayed", () => {
      const firstScenario =
        createScenario({
          id:
            "reproducibility-validation",

          seed:
            78421,

          occupantCount:
            3,
        });

      const secondScenario =
        createScenario({
          id:
            "reproducibility-validation",

          seed:
            78421,

          occupantCount:
            3,
        });

      expect(
        firstScenario,
      ).toEqual(
        secondScenario,
      );

      const first =
        runHeadlessSimulation(
          createSimulationInput(
            firstScenario,
          ),
        );

      const second =
        runHeadlessSimulation(
          createSimulationInput(
            secondScenario,
          ),
        );

      expect(first).toEqual(
        second,
      );

      expect(
        first.seed,
      ).toBe(78421);

      expect(
        second.seed,
      ).toBe(78421);
    });
  },
);