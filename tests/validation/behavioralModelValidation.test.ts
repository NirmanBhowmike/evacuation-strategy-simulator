import {
  describe,
  expect,
  it,
} from "vitest";

import {
  BottleneckFlowController,
} from "../../src/core/bottleneckFlow";
import {
  calculateWeidmannSpeedMps,
  WEIDMANN_FREE_FLOW_SPEED_MPS,
  WEIDMANN_JAM_DENSITY_PPM2,
} from "../../src/core/congestionEffects";
import {
  decideAdaptiveRerouting,
} from "../../src/core/reroutingDecision";
import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";
import {
  congestionAwareStrategy,
  hazardAwareStrategy,
} from "../../src/core/routingStrategies";

import type {
  BuildingEnvironment,
} from "../../src/types/environment";
import type {
  ExitSet,
} from "../../src/types/exit";
import type {
  NavigationEdge,
  NavigationGraph,
} from "../../src/types/navigation";
import type {
  RoutingPath,
} from "../../src/types/routing";
import type {
  RoutingStrategyContext,
  RoutingStrategyDecision,
} from "../../src/types/routingStrategy";
import type {
  ScenarioInstance,
} from "../../src/types/scenario";
import type {
  SpawnZoneSet,
} from "../../src/types/spawn";

function createSimpleEnvironment():
  BuildingEnvironment {
  return {
    layoutId:
      "behavior-validation",

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
          "corridor-short",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 4, y: 0 },
            { x: 12, y: 0 },
            { x: 12, y: 4 },
            { x: 4, y: 4 },
          ],
        },
      },

      {
        id:
          "corridor-long",

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

function createSimpleGraph():
  NavigationGraph {
  return {
    layoutId:
      "behavior-validation",

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
          "corridor-short",
      },

      {
        id:
          "exit-short",

        type:
          "EXIT",

        position: {
          x: 9,
          y: 2,
        },

        zoneId:
          "corridor-short",
      },

      {
        id:
          "exit-long",

        type:
          "EXIT",

        position: {
          x: 12,
          y: 2,
        },

        zoneId:
          "corridor-long",
      },
    ],

    edges: [
      {
        id:
          "edge-short",

        from:
          "start",

        to:
          "exit-short",

        lengthMeters:
          5,

        widthMeters:
          2,

        zoneId:
          "corridor-short",

        bidirectional:
          true,
      },

      {
        id:
          "edge-long",

        from:
          "start",

        to:
          "exit-long",

        lengthMeters:
          8,

        widthMeters:
          2,

        zoneId:
          "corridor-long",

        bidirectional:
          true,
      },
    ],
  };
}

function createSimpleExits():
  ExitSet {
  return {
    layoutId:
      "behavior-validation",

    exits: [
      {
        id:
          "exit-short",

        position: {
          x: 9,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-short",
      },

      {
        id:
          "exit-long",

        position: {
          x: 12,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-long",
      },
    ],
  };
}

function createSimpleSpawnZones():
  SpawnZoneSet {
  return {
    layoutId:
      "behavior-validation",

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

function createSimpleScenario():
  ScenarioInstance {
  return {
    id:
      "behavior-validation-scenario",

    seed:
      1042,

    layoutId:
      "behavior-validation",

    parameterSetVersion:
      "validation-v1",

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

    disruptionSchedule: [],
  };
}

function createRoutingContext(
  options: {
    shortDensity?: number;
    shortHazard?:
      "CLEAR" | "RISK" | "BLOCKED";
    longHazard?:
      "CLEAR" | "RISK" | "BLOCKED";
  } = {},
): RoutingStrategyContext {
  const graph =
    createSimpleGraph();

  const density =
    options.shortDensity;

  return {
    layoutId:
      "behavior-validation",

    startNodeId:
      "start",

    graph,

    exits:
      createSimpleExits(),

    current: {
      hazardZones: [
        {
          zoneId:
            "room-start",

          state:
            "CLEAR",
        },

        {
          zoneId:
            "corridor-short",

          state:
            options.shortHazard ??
            "CLEAR",
        },

        {
          zoneId:
            "corridor-long",

          state:
            options.longHazard ??
            "CLEAR",
        },
      ],

      blockedExitIds: [],

      densitySnapshot: {
        cellLengthMeters:
          5,

        cells:
          density ===
          undefined
            ? []
            : [
                {
                  edgeId:
                    "edge-short",

                  cellIndex:
                    0,

                  startDistanceMeters:
                    0,

                  lengthMeters:
                    5,

                  widthMeters:
                    2,

                  occupantCount:
                    Math.round(
                      density *
                        10,
                    ),

                  densityPersonsPerSquareMeter:
                    density,
                },
              ],
      },

      queueDelayByEdge: {},
    },
  };
}

function createAdaptiveGraph():
  NavigationGraph {
  return {
    layoutId:
      "adaptive-validation",

    nodes: [
      {
        id:
          "decision",

        type:
          "DECISION_POINT",

        position: {
          x: 0,
          y: 0,
        },

        zoneId:
          "corridor-current",
      },

      {
        id:
          "exit-current",

        type:
          "EXIT",

        position: {
          x: 10,
          y: 0,
        },

        zoneId:
          "corridor-current",
      },

      {
        id:
          "exit-alternative",

        type:
          "EXIT",

        position: {
          x: 8,
          y: 0,
        },

        zoneId:
          "corridor-alternative",
      },
    ],

    edges: [
      {
        id:
          "edge-current",

        from:
          "decision",

        to:
          "exit-current",

        lengthMeters:
          10,

        widthMeters:
          2,

        zoneId:
          "corridor-current",

        bidirectional:
          true,
      },

      {
        id:
          "edge-alternative",

        from:
          "decision",

        to:
          "exit-alternative",

        lengthMeters:
          8,

        widthMeters:
          2,

        zoneId:
          "corridor-alternative",

        bidirectional:
          true,
      },
    ],
  };
}

function createAdaptiveContext(
  currentHazard:
    "CLEAR" | "RISK" =
      "CLEAR",
): RoutingStrategyContext {
  return {
    layoutId:
      "adaptive-validation",

    startNodeId:
      "decision",

    graph:
      createAdaptiveGraph(),

    exits: {
      layoutId:
        "adaptive-validation",

      exits: [
        {
          id:
            "exit-current",

          position: {
            x: 10,
            y: 0,
          },

          widthMeters:
            1.8,

          connectedZoneId:
            "corridor-current",
        },

        {
          id:
            "exit-alternative",

          position: {
            x: 8,
            y: 0,
          },

          widthMeters:
            1.8,

          connectedZoneId:
            "corridor-alternative",
        },
      ],
    },

    current: {
      hazardZones: [
        {
          zoneId:
            "corridor-current",

          state:
            currentHazard,
        },

        {
          zoneId:
            "corridor-alternative",

          state:
            "CLEAR",
        },
      ],

      blockedExitIds: [],

      densitySnapshot: {
        cellLengthMeters:
          1,

        cells: [],
      },

      queueDelayByEdge: {},
    },
  };
}

function currentAdaptivePath():
  RoutingPath {
  return {
    nodeIds: [
      "decision",
      "exit-current",
    ],

    edgeIds: [
      "edge-current",
    ],

    totalCost:
      10,

    targetNodeId:
      "exit-current",
  };
}

function adaptiveCandidate():
  RoutingStrategyDecision {
  return {
    strategyId:
      "ADAPTIVE_HYBRID",

    targetExitId:
      "exit-alternative",

    path: {
      nodeIds: [
        "decision",
        "exit-alternative",
      ],

      edgeIds: [
        "edge-alternative",
      ],

      totalCost:
        8,

      targetNodeId:
        "exit-alternative",
    },

    metrics: {
      estimatedTravelTimeSeconds:
        8 /
        WEIDMANN_FREE_FLOW_SPEED_MPS,

      predictedRiskExposureSeconds:
        0,
    },
  };
}

describe(
  "Phase 5 behavioral-model validation",
  () => {
    it("validates the expected density-speed relationship", () => {
      const speedAtZero =
        calculateWeidmannSpeedMps(
          0,
        );

      const speedAtOne =
        calculateWeidmannSpeedMps(
          1,
        );

      const speedAtTwo =
        calculateWeidmannSpeedMps(
          2,
        );

      const speedAtFour =
        calculateWeidmannSpeedMps(
          4,
        );

      const speedAtJam =
        calculateWeidmannSpeedMps(
          WEIDMANN_JAM_DENSITY_PPM2,
        );

      expect(
        speedAtZero,
      ).toBeCloseTo(
        WEIDMANN_FREE_FLOW_SPEED_MPS,
        12,
      );

      expect(
        speedAtOne,
      ).toBeLessThan(
        speedAtZero,
      );

      expect(
        speedAtTwo,
      ).toBeLessThan(
        speedAtOne,
      );

      expect(
        speedAtFour,
      ).toBeLessThan(
        speedAtTwo,
      );

      expect(
        speedAtFour,
      ).toBeGreaterThan(0);

      expect(
        speedAtJam,
      ).toBe(0);
    });

    it("validates bottleneck capacity against Q = q_s × W and discrete admissions", () => {
      const specificFlow =
        1.3;

      const controller =
        new BottleneckFlowController(
          specificFlow,
        );

      const edge:
        NavigationEdge = {
        id:
          "validation-bottleneck",

        from:
          "a",

        to:
          "b",

        lengthMeters:
          5,

        widthMeters:
          2,

        zoneId:
          "corridor",

        bidirectional:
          true,
      };

      /**
       * Analytical capacity:
       *
       * Q = 1.3 × 2
       *   = 2.6 persons/second
       */
      expect(
        controller
          .calculateCapacityPersonsPerSecond(
            edge,
          ),
      ).toBeCloseTo(
        2.6,
        12,
      );

      const first =
        controller.admitAgents(
          edge,
          [
            "agent-1",
            "agent-2",
            "agent-3",
            "agent-4",
          ],
          1,
        );

      expect(
        first.admittedAgentIds,
      ).toEqual([
        "agent-1",
        "agent-2",
      ]);

      expect(
        first.queuedAgentIds,
      ).toEqual([
        "agent-3",
        "agent-4",
      ]);

      expect(
        first.carryPersons,
      ).toBeCloseTo(
        0.6,
        12,
      );

      /**
       * Next second:
       *
       * previous carry 0.6
       * + new capacity 2.6
       * = 3.2 person permits.
       *
       * Only two people remain, so both are admitted and unused
       * service capacity is discarded.
       */
      const second =
        controller.admitAgents(
          edge,
          first.queuedAgentIds,
          1,
        );

      expect(
        second.admittedAgentIds,
      ).toEqual([
        "agent-3",
        "agent-4",
      ]);

      expect(
        second.queuedAgentIds,
      ).toEqual([]);

      expect(
        second.carryPersons,
      ).toBe(0);

      expect(
        controller
          .getCarryPersons(
            edge.id,
          ),
      ).toBe(0);
    });

    it("produces exactly zero hazard exposure when no hazard is active", () => {
      const result =
        runHeadlessSimulation({
          scenario:
            createSimpleScenario(),

          environment:
            createSimpleEnvironment(),

          graph:
            createSimpleGraph(),

          exits:
            createSimpleExits(),

          spawnZones:
            createSimpleSpawnZones(),

          configuration: {
            strategyId:
              "STATIC_SHORTEST_PATH",

            timestepSeconds:
              0.1,

            maximumSimulationTimeSeconds:
              30,

            densityCellLengthMeters:
              100,

            specificFlowPersonsPerMeterSecond:
              100,
          },
        });

      expect(
        result.metrics
          .evacuatedAgents,
      ).toBe(1);

      expect(
        result.metrics
          .populationHazardExposurePersonSeconds,
      ).toBe(0);

      expect(
        result.metrics
          .meanHazardExposureSeconds,
      ).toBe(0);

      expect(
        result.finalAgents[0]
          ?.hazardExposureSeconds,
      ).toBe(0);
    });

    it("validates routing responses to congestion and hazard state changes", () => {
      const clearContext =
        createRoutingContext();

      const clearCongestionDecision =
        congestionAwareStrategy
          .route(
            clearContext,
          );

      /**
       * With both routes uncongested, the 5 m route should win.
       */
      expect(
        clearCongestionDecision
          ?.targetExitId,
      ).toBe(
        "exit-short",
      );

      const congestedContext =
        createRoutingContext({
          shortDensity:
            4,
        });

      const congestedDecision =
        congestionAwareStrategy
          .route(
            congestedContext,
          );

      /**
       * Heavy density on the 5 m route should make the longer
       * 8 m alternative faster under the current model.
       */
      expect(
        congestedDecision
          ?.targetExitId,
      ).toBe(
        "exit-long",
      );

      const riskContext =
        createRoutingContext({
          shortHazard:
            "RISK",
        });

      const hazardDecision =
        hazardAwareStrategy
          .route(
            riskContext,
          );

      /**
       * Hazard-Aware is lexicographic:
       * a longer CLEAR route is preferred over a shorter RISK
       * route.
       */
      expect(
        hazardDecision
          ?.targetExitId,
      ).toBe(
        "exit-long",
      );

      expect(
        hazardDecision
          ?.metrics
          .predictedRiskExposureSeconds,
      ).toBe(0);
    });

    it("validates Adaptive Hybrid inertia threshold and safety override behavior", () => {
      const clearContext =
        createAdaptiveContext(
          "CLEAR",
        );

      const currentPath =
        currentAdaptivePath();

      const candidate =
        adaptiveCandidate();

      /**
       * Current route:
       * 10 m
       *
       * Candidate:
       * 8 m
       *
       * Equal free-flow speed means relative time improvement is
       * also exactly:
       *
       * (10 - 8) / 10 = 0.20
       */
      const rejected =
        decideAdaptiveRerouting(
          clearContext,
          currentPath,
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0.25,

            candidate,
          },
        );

      expect(
        rejected.action,
      ).toBe(
        "KEEP_CURRENT",
      );

      expect(
        rejected.reason,
      ).toBe(
        "IMPROVEMENT_THRESHOLD_NOT_MET",
      );

      expect(
        rejected.relativeImprovement,
      ).toBeCloseTo(
        0.20,
        12,
      );

      const accepted =
        decideAdaptiveRerouting(
          clearContext,
          currentPath,
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0.20,

            candidate,
          },
        );

      expect(
        accepted.action,
      ).toBe(
        "REROUTE",
      );

      expect(
        accepted.reason,
      ).toBe(
        "IMPROVEMENT_THRESHOLD_MET",
      );

      /**
       * Now make the current route RISK while the alternative
       * remains CLEAR.
       *
       * Safety improvement must override even a 100% normal
       * time-improvement threshold.
       */
      const hazardousContext =
        createAdaptiveContext(
          "RISK",
        );

      const safetyOverride =
        decideAdaptiveRerouting(
          hazardousContext,
          currentPath,
          {
            trigger:
              "HAZARD_CHANGE",

            threshold:
              1,

            candidate,
          },
        );

      expect(
        safetyOverride.action,
      ).toBe(
        "REROUTE",
      );

      expect(
        safetyOverride.reason,
      ).toBe(
        "SAFER_ALTERNATIVE",
      );

      expect(
        safetyOverride.current
          .predictedRiskExposureSeconds,
      ).toBeGreaterThan(0);

      expect(
        safetyOverride.candidate
          ?.predictedRiskExposureSeconds,
      ).toBe(0);
    });
  },
);