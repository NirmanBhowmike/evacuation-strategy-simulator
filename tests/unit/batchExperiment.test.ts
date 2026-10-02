import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runBatchExperiment,
} from "../../src/core/runBatchExperiment";

import type {
  BatchExperimentConfiguration,
} from "../../src/types/batchExperiment";
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
      "batch-test",

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
      "batch-test",

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
      "batch-test",

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
      "batch-test",

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
  id: string,
  seed: number,
  parameterSetVersion:
    string,
): ScenarioInstance {
  return {
    id,

    seed,

    layoutId:
      "batch-test",

    parameterSetVersion,

    occupants: [
      {
        id:
          `${id}-agent-001`,

        spawnPosition: {
          x: 2,
          y: 2,
        },

        desiredSpeedMps:
          1.34,
      },
    ],

    disruptionSchedule: [],
  };
}

function createConfiguration():
  BatchExperimentConfiguration {
  return {
    batchId:
      "batch-001",

    scenarios: [
      createScenario(
        "scenario-001",
        1042,
        "parameters-v1",
      ),

      createScenario(
        "scenario-002",
        2042,
        "parameters-v1",
      ),
    ],

    strategyIds: [
      "NEAREST_EXIT",
      "STATIC_SHORTEST_PATH",
    ],

    environment:
      createEnvironment(),

    graph:
      createGraph(),

    exits:
      createExits(),

    spawnZones:
      createSpawnZones(),

    simulationConfiguration: {
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
  "Batch experiment runner",
  () => {
    it("runs the complete Scenario × Strategy matrix", () => {
      const result =
        runBatchExperiment(
          createConfiguration(),
        );

      expect(
        result.totalScenarios,
      ).toBe(2);

      expect(
        result.totalStrategies,
      ).toBe(2);

      expect(
        result.totalRuns,
      ).toBe(4);

      expect(
        result.runs,
      ).toHaveLength(4);
    });

    it("creates one paired run for every strategy using the same scenario", () => {
      const result =
        runBatchExperiment(
          createConfiguration(),
        );

      const pairedRuns =
        result.runs.filter(
          (run) =>
            run.scenarioId ===
            "scenario-001",
        );

      expect(
        pairedRuns,
      ).toHaveLength(2);

      expect(
        pairedRuns.map(
          (run) =>
            run.strategyId,
        ),
      ).toEqual([
        "NEAREST_EXIT",
        "STATIC_SHORTEST_PATH",
      ]);

      expect(
        pairedRuns.every(
          (run) =>
            run.seed ===
            1042,
        ),
      ).toBe(true);

      expect(
        pairedRuns.every(
          (run) =>
            run.pairKey ===
            "scenario-001",
        ),
      ).toBe(true);
    });

    it("propagates scenario identifiers into every run result", () => {
      const result =
        runBatchExperiment(
          createConfiguration(),
        );

      expect(
        result.scenarioIds,
      ).toEqual([
        "scenario-001",
        "scenario-002",
      ]);

      expect(
        result.runs[0]
          ?.scenarioId,
      ).toBe(
        "scenario-001",
      );

      expect(
        result.runs[0]
          ?.result
          .scenarioId,
      ).toBe(
        "scenario-001",
      );
    });

    it("propagates parameter-set identifiers into every run result", () => {
      const result =
        runBatchExperiment(
          createConfiguration(),
        );

      expect(
        result.parameterSetIds,
      ).toEqual([
        "parameters-v1",
      ]);

      for (
        const run of
          result.runs
      ) {
        expect(
          run.parameterSetId,
        ).toBe(
          "parameters-v1",
        );

        expect(
          run.result
            .parameterSetId,
        ).toBe(
          "parameters-v1",
        );
      }
    });

    it("creates deterministic unique run identifiers", () => {
      const result =
        runBatchExperiment(
          createConfiguration(),
        );

      expect(
        result.runs.map(
          (run) =>
            run.runId,
        ),
      ).toEqual([
        "scenario-001__NEAREST_EXIT",
        "scenario-001__STATIC_SHORTEST_PATH",
        "scenario-002__NEAREST_EXIT",
        "scenario-002__STATIC_SHORTEST_PATH",
      ]);

      expect(
        new Set(
          result.runs.map(
            (run) =>
              run.runId,
          ),
        ).size,
      ).toBe(4);
    });

    it("produces deterministic batch results for identical inputs", () => {
      const first =
        runBatchExperiment(
          createConfiguration(),
        );

      const second =
        runBatchExperiment(
          createConfiguration(),
        );

      expect(first).toEqual(
        second,
      );
    });

    it("does not mutate the supplied ScenarioInstances", () => {
      const configuration =
        createConfiguration();

      const before =
        JSON.stringify(
          configuration.scenarios,
        );

      runBatchExperiment(
        configuration,
      );

      expect(
        JSON.stringify(
          configuration.scenarios,
        ),
      ).toBe(before);
    });

    it("rejects duplicate scenario identifiers", () => {
      const configuration =
        createConfiguration();

      const duplicate:
        BatchExperimentConfiguration = {
        ...configuration,

        scenarios: [
          createScenario(
            "scenario-001",
            1042,
            "parameters-v1",
          ),

          createScenario(
            "scenario-001",
            2042,
            "parameters-v1",
          ),
        ],
      };

      expect(() =>
        runBatchExperiment(
          duplicate,
        ),
      ).toThrow(
        /Duplicate scenario id/,
      );
    });

    it("rejects duplicate strategies and missing experiment identifiers", () => {
      const configuration =
        createConfiguration();

      expect(() =>
        runBatchExperiment({
          ...configuration,

          strategyIds: [
            "NEAREST_EXIT",
            "NEAREST_EXIT",
          ],
        }),
      ).toThrow(
        /Duplicate routing strategy/,
      );

      expect(() =>
        runBatchExperiment({
          ...configuration,

          batchId: " ",
        }),
      ).toThrow(
        /Batch id must be non-empty/,
      );

      expect(() =>
        runBatchExperiment({
          ...configuration,

          scenarios: [
            createScenario(
              "",
              1042,
              "parameters-v1",
            ),
          ],
        }),
      ).toThrow(
        /Scenario id must be non-empty/,
      );

      expect(() =>
        runBatchExperiment({
          ...configuration,

          scenarios: [
            createScenario(
              "scenario-001",
              1042,
              "",
            ),
          ],
        }),
      ).toThrow(
        /Parameter-set id/,
      );
    });

    it("rejects empty scenario or strategy collections", () => {
      const configuration =
        createConfiguration();

      expect(() =>
        runBatchExperiment({
          ...configuration,

          scenarios: [],
        }),
      ).toThrow(
        /at least one scenario/,
      );

      expect(() =>
        runBatchExperiment({
          ...configuration,

          strategyIds: [],
        }),
      ).toThrow(
        /at least one routing strategy/,
      );
    });
  },
);