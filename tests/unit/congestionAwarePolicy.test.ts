import {
  describe,
  expect,
  it,
} from "vitest";

import {
  estimateCongestedEdgeTravelTimeSeconds,
  routeByCongestionAwarePolicy,
} from "../../src/core/congestionAwarePolicy";
import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { DensitySnapshot } from "../../src/types/density";
import type { ExitSet } from "../../src/types/exit";
import type {
  NavigationEdge,
  NavigationGraph,
} from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "congestion-routing-test",

    widthMeters:
      30,

    heightMeters:
      20,

    zones: [
      {
        id:
          "corridor-short",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 4 },
            { x: 0, y: 4 },
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
            { x: 0, y: 5 },
            { x: 15, y: 5 },
            { x: 15, y: 9 },
            { x: 0, y: 9 },
          ],
        },
      },
    ],
  };
}

function createGraph(): NavigationGraph {
  return {
    layoutId:
      "congestion-routing-test",

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
          "corridor-short",
      },

      {
        id:
          "exit-short",

        type:
          "EXIT",

        position: {
          x: 5,
          y: 0,
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
          x: 8,
          y: 0,
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
          3,

        zoneId:
          "corridor-long",

        bidirectional:
          true,
      },
    ],
  };
}

function createExits(): ExitSet {
  return {
    layoutId:
      "congestion-routing-test",

    exits: [
      {
        id:
          "exit-short",

        position: {
          x: 5,
          y: 0,
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
          x: 8,
          y: 0,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-long",
      },
    ],
  };
}

function createScenario(): ScenarioInstance {
  return {
    id:
      "congestion-routing-scenario",

    seed:
      1042,

    layoutId:
      "congestion-routing-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "block-long-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          5,

        targetId:
          "exit-long",
      },
    ],
  };
}

function createEmptyDensity():
  DensitySnapshot {
  return {
    cellLengthMeters: 1,

    cells: [],
  };
}

function createCongestedShortEdgeDensity():
  DensitySnapshot {
  return {
    cellLengthMeters: 5,

    cells: [
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
          40,

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
  "Congestion-Aware routing policy",
  () => {
    it("chooses the shorter route when both routes are uncongested", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-short",
      );
    });

    it("switches to a longer route when the shorter route is heavily congested", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createCongestedShortEdgeDensity(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-long",
      );

      expect(
        decision?.path.edgeIds,
      ).toEqual([
        "edge-long",
      ]);
    });

    it("uses density-adjusted travel time rather than raw distance", () => {
      const graph =
        createGraph();

      const shortEdge =
        graph.edges.find(
          (edge) =>
            edge.id ===
            "edge-short",
        )!;

      const freeFlowTime =
        estimateCongestedEdgeTravelTimeSeconds(
          shortEdge,
          createEmptyDensity(),
        );

      const congestedTime =
        estimateCongestedEdgeTravelTimeSeconds(
          shortEdge,
          createCongestedShortEdgeDensity(),
        );

      expect(
        congestedTime,
      ).toBeGreaterThan(
        freeFlowTime,
      );
    });

    it("includes queue delay in edge routing cost", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const withoutQueue =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      expect(
        withoutQueue?.targetExitId,
      ).toBe(
        "exit-short",
      );

      const withQueue =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
          {
            "edge-short": 4,
          },
        );

      expect(
        withQueue?.targetExitId,
      ).toBe(
        "exit-long",
      );
    });

    it("does not penalize RISK zones", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-short",
        "RISK",
      );

      const decision =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-short",
      );
    });

    it("excludes BLOCKED corridors", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-short",
        "BLOCKED",
      );

      const decision =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-long",
      );
    });

    it("does not route to a dynamically blocked exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      disruptions.processDueEvents(
        5,
      );

      const decision =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-short",
      );
    });

    it("returns null when no exit can be reached", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-short",
        "BLOCKED",
      );

      hazardField.setZoneState(
        "corridor-long",
        "BLOCKED",
      );

      const decision =
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      expect(
        decision,
      ).toBeNull();
    });

    it("returns a zero-time path when already at an available exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByCongestionAwarePolicy(
          "exit-short",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-short",
      );

      expect(
        decision?.estimatedTravelTimeSeconds,
      ).toBe(0);

      expect(
        decision?.path.edgeIds,
      ).toEqual([]);
    });

    it("rejects invalid congestion observations", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(() =>
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
          {
            "edge-short": -1,
          },
        ),
      ).toThrow(
        /Queue delay.*non-negative/,
      );

      const invalidDensity:
        DensitySnapshot = {
        cellLengthMeters:
          1,

        cells: [
          {
            edgeId:
              "missing-edge",

            cellIndex:
              0,

            startDistanceMeters:
              0,

            lengthMeters:
              1,

            widthMeters:
              1,

            occupantCount:
              1,

            densityPersonsPerSquareMeter:
              1,
          },
        ],
      };

      expect(() =>
        routeByCongestionAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          invalidDensity,
        ),
      ).toThrow(
        /unknown edge/,
      );
    });
  },
);