import {
  describe,
  expect,
  it,
} from "vitest";

import { routeByAdaptiveHybridPolicy } from "../../src/core/adaptiveHybridPolicy";
import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { DensitySnapshot } from "../../src/types/density";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "adaptive-hybrid-test",

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
          "corridor-alternative",

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

function createGraph(): NavigationGraph {
  return {
    layoutId:
      "adaptive-hybrid-test",

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
          "edge-alternative",

        from:
          "start",

        to:
          "exit-alternative",

        lengthMeters:
          8,

        widthMeters:
          3,

        zoneId:
          "corridor-alternative",

        bidirectional:
          true,
      },
    ],
  };
}

function createExits(): ExitSet {
  return {
    layoutId:
      "adaptive-hybrid-test",

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
  };
}

function createScenario(): ScenarioInstance {
  return {
    id:
      "adaptive-hybrid-scenario",

    seed:
      1042,

    layoutId:
      "adaptive-hybrid-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "block-alternative-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          5,

        targetId:
          "exit-alternative",
      },
    ],
  };
}

function createEmptyDensity():
  DensitySnapshot {
  return {
    cellLengthMeters:
      1,

    cells: [],
  };
}

function createShortEdgeCongestion():
  DensitySnapshot {
  return {
    cellLengthMeters:
      5,

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
  "Adaptive Hybrid routing policy",
  () => {
    it("chooses the faster route when both alternatives are CLEAR and uncongested", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByAdaptiveHybridPolicy(
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

      expect(
        decision?.predictedRiskExposureSeconds,
      ).toBe(0);
    });

    it("responds to current congestion when safety is equal", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createShortEdgeCongestion(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-alternative",
      );

      expect(
        decision?.path.edgeIds,
      ).toEqual([
        "edge-alternative",
      ]);
    });

    it("responds to current queue delay when safety is equal", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
          {
            "edge-short":
              5,
          },
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-alternative",
      );
    });

    it("prefers a CLEAR alternative over a faster RISK route", () => {
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
        routeByAdaptiveHybridPolicy(
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
        "exit-alternative",
      );

      expect(
        decision?.predictedRiskExposureSeconds,
      ).toBe(0);
    });

    it("uses congestion-adjusted risk exposure rather than free-flow exposure", () => {
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

      hazardField.setZoneState(
        "corridor-alternative",
        "BLOCKED",
      );

      const freeFlow =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      const congested =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createShortEdgeCongestion(),
        );

      expect(
        freeFlow?.targetExitId,
      ).toBe(
        "exit-short",
      );

      expect(
        congested?.targetExitId,
      ).toBe(
        "exit-short",
      );

      expect(
        congested!
          .predictedRiskExposureSeconds,
      ).toBeGreaterThan(
        freeFlow!
          .predictedRiskExposureSeconds,
      );
    });

    it("includes risky-edge queue delay in predicted risk exposure", () => {
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

      hazardField.setZoneState(
        "corridor-alternative",
        "BLOCKED",
      );

      const withoutQueue =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        );

      const withQueue =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
          {
            "edge-short":
              3,
          },
        );

      expect(
        withQueue!
          .predictedRiskExposureSeconds,
      ).toBeCloseTo(
        withoutQueue!
          .predictedRiskExposureSeconds +
          3,
      );

      expect(
        withQueue!
          .estimatedTravelTimeSeconds,
      ).toBeCloseTo(
        withoutQueue!
          .estimatedTravelTimeSeconds +
          3,
      );
    });

    it("completely excludes BLOCKED routes", () => {
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
        routeByAdaptiveHybridPolicy(
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
        "exit-alternative",
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

      /**
       * Make the alternative clearly preferable first.
       */
      const before =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createShortEdgeCongestion(),
        );

      expect(
        before?.targetExitId,
      ).toBe(
        "exit-alternative",
      );

      disruptions.processDueEvents(
        5,
      );

      const after =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createShortEdgeCongestion(),
        );

      expect(
        after?.targetExitId,
      ).toBe(
        "exit-short",
      );
    });

    it("returns null when every feasible route is unavailable", () => {
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
        "corridor-alternative",
        "BLOCKED",
      );

      const decision =
        routeByAdaptiveHybridPolicy(
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

    it("returns zero cost when already at an available exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByAdaptiveHybridPolicy(
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
        decision?.predictedRiskExposureSeconds,
      ).toBe(0);

      expect(
        decision?.estimatedTravelTimeSeconds,
      ).toBe(0);

      expect(
        decision?.path.edgeIds,
      ).toEqual([]);
    });

    it("uses current state only and does not anticipate future disruptions", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      /**
       * Congestion makes exit-alternative preferable.
       * It is scheduled to close at t=5, but that event has not
       * yet been processed.
       */
      const decision =
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createShortEdgeCongestion(),
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-alternative",
      );
    });

    it("rejects invalid start nodes, layouts, density data, and queue delays", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(() =>
        routeByAdaptiveHybridPolicy(
          "missing-node",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        ),
      ).toThrow(
        /Navigation node not found/,
      );

      const wrongGraph:
        NavigationGraph = {
        ...graph,

        layoutId:
          "wrong-layout",
      };

      expect(() =>
        routeByAdaptiveHybridPolicy(
          "start",
          wrongGraph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
        ),
      ).toThrow(
        /must use the same layout/,
      );

      expect(() =>
        routeByAdaptiveHybridPolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createEmptyDensity(),
          {
            "edge-short":
              -1,
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
        routeByAdaptiveHybridPolicy(
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