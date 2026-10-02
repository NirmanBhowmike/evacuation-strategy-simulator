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
      "timestep-convergence",

    widthMeters:
      20,

    heightMeters:
      10,

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
          "corridor-main",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 4, y: 0 },
            { x: 16, y: 0 },
            { x: 16, y: 4 },
            { x: 4, y: 4 },
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
      "timestep-convergence",

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
          "corridor-main",
      },

      {
        id:
          "exit-main",

        type:
          "EXIT",

        position: {
          x: 14,
          y: 2,
        },

        zoneId:
          "corridor-main",
      },
    ],

    edges: [
      {
        id:
          "edge-main",

        from:
          "start",

        to:
          "exit-main",

        lengthMeters:
          10,

        /**
         * Wide edge minimizes density effects so the convergence
         * study primarily evaluates numerical timestep behavior.
         */
        widthMeters:
          20,

        zoneId:
          "corridor-main",

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
      "timestep-convergence",

    exits: [
      {
        id:
          "exit-main",

        position: {
          x: 14,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-main",
      },
    ],
  };
}

function createSpawnZones():
  SpawnZoneSet {
  return {
    layoutId:
      "timestep-convergence",

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
  withHazard:
    boolean,
): ScenarioInstance {
  return {
    id:
      withHazard
        ? "timestep-hazard"
        : "timestep-clear",

    seed:
      1042,

    layoutId:
      "timestep-convergence",

    parameterSetVersion:
      "timestep-study-v1",

    occupants: [
      {
        id:
          "agent-001",

        spawnPosition: {
          x: 2,
          y: 2,
        },

        desiredSpeedMps:
          1.34,
      },
    ],

    disruptionSchedule:
      withHazard
        ? [
            {
              id:
                "activate-risk",

              type:
                "HAZARD_ACTIVATE",

              /**
               * Deliberately not aligned with any candidate
               * timestep.
               *
               * This allows the convergence study to observe
               * event-activation discretization.
               */
              activationTimeSeconds:
                1.01,

              targetId:
                "corridor-main",
            },
          ]
        : [],
  };
}

function runAtTimestep(
  timestepSeconds:
    number,
  withHazard =
    false,
) {
  return runHeadlessSimulation({
    scenario:
      createScenario(
        withHazard,
      ),

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
        "STATIC_SHORTEST_PATH",

      timestepSeconds,

      maximumSimulationTimeSeconds:
        30,

      densityCellLengthMeters:
        100,

      /**
       * Queueing is intentionally removed from this calibration
       * case so timestep behavior can be isolated.
       */
      specificFlowPersonsPerMeterSecond:
        1000,
    },
  });
}

function relativeDifference(
  reference: number,
  candidate: number,
): number {
  if (
    reference === 0
  ) {
    return Math.abs(
      candidate,
    );
  }

  return (
    Math.abs(
      candidate -
      reference,
    ) /
    Math.abs(
      reference,
    )
  );
}

describe(
  "Numerical timestep convergence",
  () => {
    it("preserves the same qualitative evacuation outcome across 0.025, 0.05, and 0.10 second timesteps", () => {
      const fine =
        runAtTimestep(
          0.025,
        );

      const production =
        runAtTimestep(
          0.05,
        );

      const coarse =
        runAtTimestep(
          0.10,
        );

      for (
        const result of [
          fine,
          production,
          coarse,
        ]
      ) {
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
            ?.targetExitId,
        ).toBe(
          "exit-main",
        );

        expect(
          result.finalAgents[0]
            ?.status,
        ).toBe(
          "EVACUATED",
        );

        expect(
          result.metrics
            .meanTravelDistanceMeters,
        ).toBeCloseTo(
          10,
          10,
        );
      }
    });

    it("keeps the 0.05 second evacuation-time result within one percent of the 0.025 second reference", () => {
      const fine =
        runAtTimestep(
          0.025,
        );

      const production =
        runAtTimestep(
          0.05,
        );

      const fineTime =
        fine.metrics
          .totalEvacuationTimeSeconds;

      const productionTime =
        production.metrics
          .totalEvacuationTimeSeconds;

      expect(
        fineTime,
      ).not.toBeNull();

      expect(
        productionTime,
      ).not.toBeNull();

      const difference =
        relativeDifference(
          fineTime!,
          productionTime!,
        );

      expect(
        difference,
      ).toBeLessThanOrEqual(
        0.01,
      );
    });

    it("keeps 0.05 second hazard-exposure error smaller than the 0.10 second error", () => {
      const fine =
        runAtTimestep(
          0.025,
          true,
        );

      const production =
        runAtTimestep(
          0.05,
          true,
        );

      const coarse =
        runAtTimestep(
          0.10,
          true,
        );

      const referenceExposure =
        fine.metrics
          .populationHazardExposurePersonSeconds;

      const productionError =
        Math.abs(
          production.metrics
            .populationHazardExposurePersonSeconds -
          referenceExposure,
        );

      const coarseError =
        Math.abs(
          coarse.metrics
            .populationHazardExposurePersonSeconds -
          referenceExposure,
        );

      expect(
        referenceExposure,
      ).toBeGreaterThan(0);

      expect(
        productionError,
      ).toBeLessThan(
        coarseError,
      );
    });

    it("keeps 0.05 second hazard exposure within one percent of the fine reference", () => {
      const fine =
        runAtTimestep(
          0.025,
          true,
        );

      const production =
        runAtTimestep(
          0.05,
          true,
        );

      const difference =
        relativeDifference(
          fine.metrics
            .populationHazardExposurePersonSeconds,

          production.metrics
            .populationHazardExposurePersonSeconds,
        );

      expect(
        difference,
      ).toBeLessThanOrEqual(
        0.01,
      );
    });

    it("reduces simulation steps by approximately half relative to 0.025 seconds while retaining converged outcomes", () => {
      const fine =
        runAtTimestep(
          0.025,
          true,
        );

      const production =
        runAtTimestep(
          0.05,
          true,
        );

      expect(
        production.ticks,
      ).toBeLessThan(
        fine.ticks,
      );

      const tickRatio =
        production.ticks /
        fine.ticks;

      expect(
        tickRatio,
      ).toBeGreaterThan(
        0.45,
      );

      expect(
        tickRatio,
      ).toBeLessThan(
        0.55,
      );

      expect(
        production.metrics
          .completionRate,
      ).toBe(
        fine.metrics
          .completionRate,
      );

      expect(
        production.metrics
          .meanTravelDistanceMeters,
      ).toBeCloseTo(
        fine.metrics
          .meanTravelDistanceMeters!,
        10,
      );
    });
  },
);