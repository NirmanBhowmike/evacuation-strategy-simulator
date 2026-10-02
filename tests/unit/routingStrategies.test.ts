import {
  describe,
  expect,
  it,
} from "vitest";

import { createRoutingStrategyContext } from "../../src/core/createRoutingStrategyContext";
import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";
import {
  adaptiveHybridStrategy,
  congestionAwareStrategy,
  getRoutingStrategy,
  hazardAwareStrategy,
  nearestExitStrategy,
  ROUTING_STRATEGIES,
  staticShortestPathStrategy,
} from "../../src/core/routingStrategies";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { DensitySnapshot } from "../../src/types/density";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment():
  BuildingEnvironment {
  return {
    layoutId:
      "common-strategy-test",

    widthMeters:
      30,

    heightMeters:
      20,

    zones: [
      {
        id:
          "corridor-near",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 12, y: 0 },
            { x: 12, y: 4 },
            { x: 0, y: 4 },
          ],
        },
      },

      {
        id:
          "corridor-far",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 5 },
            { x: 20, y: 5 },
            { x: 20, y: 9 },
            { x: 0, y: 9 },
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
      "common-strategy-test",

    nodes: [
      {
        id:
          "start",

        type:
          "DECISION_POINT",

        position: {
          x: 0,
          y: 0,
        },

        zoneId:
          "corridor-near",
      },

      {
        id:
          "detour",

        type:
          "JUNCTION",

        position: {
          x: 5,
          y: 3,
        },

        zoneId:
          "corridor-near",
      },

      {
        id:
          "exit-near",

        type:
          "EXIT",

        position: {
          x: 2,
          y: 0,
        },

        zoneId:
          "corridor-near",
      },

      {
        id:
          "exit-far",

        type:
          "EXIT",

        position: {
          x: 4,
          y: 0,
        },

        zoneId:
          "corridor-far",
      },
    ],

    edges: [
      {
        id:
          "edge-start-detour",

        from:
          "start",

        to:
          "detour",

        lengthMeters:
          10,

        widthMeters:
          2,

        zoneId:
          "corridor-near",

        bidirectional:
          true,
      },

      {
        id:
          "edge-detour-near",

        from:
          "detour",

        to:
          "exit-near",

        lengthMeters:
          10,

        widthMeters:
          2,

        zoneId:
          "corridor-near",

        bidirectional:
          true,
      },

      {
        id:
          "edge-far",

        from:
          "start",

        to:
          "exit-far",

        lengthMeters:
          8,

        widthMeters:
          3,

        zoneId:
          "corridor-far",

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
      "common-strategy-test",

    exits: [
      {
        id:
          "exit-near",

        position: {
          x: 2,
          y: 0,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-near",
      },

      {
        id:
          "exit-far",

        position: {
          x: 4,
          y: 0,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-far",
      },
    ],
  };
}

function createScenario():
  ScenarioInstance {
  return {
    id:
      "common-strategy-scenario",

    seed:
      1042,

    layoutId:
      "common-strategy-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "future-far-block",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          100,

        targetId:
          "exit-far",
      },
    ],
  };
}

function emptyDensity():
  DensitySnapshot {
  return {
    cellLengthMeters:
      1,

    cells: [],
  };
}

function congestedFarDensity():
  DensitySnapshot {
  return {
    cellLengthMeters:
      8,

    cells: [
      {
        edgeId:
          "edge-far",

        cellIndex:
          0,

        startDistanceMeters:
          0,

        lengthMeters:
          8,

        widthMeters:
          3,

        occupantCount:
          80,

        densityPersonsPerSquareMeter:
          4,
      },
    ],
  };
}

function createSystem() {
  const environment =
    createEnvironment();

  const graph =
    createGraph();

  const exits =
    createExits();

  const hazardField =
    new HazardField(
      environment,
    );

  const disruptions =
    new DynamicDisruptionController(
      createScenario(),
      environment,
      exits,
      hazardField,
    );

  return {
    environment,
    graph,
    exits,
    hazardField,
    disruptions,
  };
}

describe(
  "Common routing strategies",
  () => {
    it("registers all five routing strategies", () => {
      expect(
        Object.keys(
          ROUTING_STRATEGIES,
        ).sort(),
      ).toEqual([
        "ADAPTIVE_HYBRID",
        "CONGESTION_AWARE",
        "HAZARD_AWARE",
        "NEAREST_EXIT",
        "STATIC_SHORTEST_PATH",
      ]);
    });

    it("retrieves strategies through the common registry", () => {
      expect(
        getRoutingStrategy(
          "NEAREST_EXIT",
        ),
      ).toBe(
        nearestExitStrategy,
      );

      expect(
        getRoutingStrategy(
          "ADAPTIVE_HYBRID",
        ),
      ).toBe(
        adaptiveHybridStrategy,
      );
    });

    it("runs Nearest Exit through the common strategy interface", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          emptyDensity(),
        );

      const decision =
        nearestExitStrategy.route(
          context,
        );

      expect(
        decision?.strategyId,
      ).toBe(
        "NEAREST_EXIT",
      );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-near",
      );

      expect(
        decision?.metrics
          .straightLineDistanceMeters,
      ).toBeCloseTo(2);
    });

    it("runs Static Shortest Path through the same interface", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          emptyDensity(),
        );

      const decision =
        staticShortestPathStrategy.route(
          context,
        );

      expect(
        decision?.strategyId,
      ).toBe(
        "STATIC_SHORTEST_PATH",
      );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-far",
      );

      expect(
        decision?.metrics
          .networkDistanceMeters,
      ).toBe(8);
    });

    it("allows Congestion-Aware routing to respond to current density", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const normalContext =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          emptyDensity(),
        );

      expect(
        congestionAwareStrategy
          .route(
            normalContext,
          )
          ?.targetExitId,
      ).toBe(
        "exit-far",
      );

      const congestedContext =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          congestedFarDensity(),
        );

      expect(
        congestionAwareStrategy
          .route(
            congestedContext,
          )
          ?.targetExitId,
      ).toBe(
        "exit-near",
      );
    });

    it("allows Hazard-Aware routing to prefer a longer CLEAR route", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-far",
        "RISK",
      );

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          emptyDensity(),
        );

      const decision =
        hazardAwareStrategy.route(
          context,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-near",
      );

      expect(
        decision?.metrics
          .predictedRiskExposureSeconds,
      ).toBe(0);
    });

    it("allows Adaptive Hybrid to combine hazard and current congestion information", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-far",
        "RISK",
      );

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          congestedFarDensity(),
        );

      const decision =
        adaptiveHybridStrategy.route(
          context,
        );

      expect(
        decision?.strategyId,
      ).toBe(
        "ADAPTIVE_HYBRID",
      );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-near",
      );
    });

    it("prevents every strategy from using a future exit blockage", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      /**
       * exit-far is scheduled to close at t=100.
       * The event has not been processed, so strategies must
       * treat it as currently available.
       */
      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          emptyDensity(),
        );

      expect(
        context.current
          .blockedExitIds,
      ).toEqual([]);

      expect(
        staticShortestPathStrategy
          .route(
            context,
          )
          ?.targetExitId,
      ).toBe(
        "exit-far",
      );

      expect(
        congestionAwareStrategy
          .route(
            context,
          )
          ?.targetExitId,
      ).toBe(
        "exit-far",
      );
    });

    it("makes a blockage visible to every strategy only after the event is applied", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      disruptions.processDueEvents(
        100,
      );

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          emptyDensity(),
        );

      expect(
        context.current
          .blockedExitIds,
      ).toEqual([
        "exit-far",
      ]);

      const strategies = [
        nearestExitStrategy,
        staticShortestPathStrategy,
        congestionAwareStrategy,
        hazardAwareStrategy,
        adaptiveHybridStrategy,
      ];

      for (
        const strategy of
          strategies
      ) {
        expect(
          strategy.route(
            context,
          )?.targetExitId,
        ).toBe(
          "exit-near",
        );
      }
    });

    it("uses one uniform route method for every strategy", () => {
      const strategies = [
        nearestExitStrategy,
        staticShortestPathStrategy,
        congestionAwareStrategy,
        hazardAwareStrategy,
        adaptiveHybridStrategy,
      ];

      for (
        const strategy of
          strategies
      ) {
        expect(
          typeof strategy.route,
        ).toBe(
          "function",
        );

        expect(
          typeof strategy.id,
        ).toBe(
          "string",
        );
      }
    });
  },
);