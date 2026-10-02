import {
  describe,
  expect,
  it,
} from "vitest";

import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";
import { routeByHazardAwarePolicy } from "../../src/core/hazardAwarePolicy";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "hazard-routing-test",

    widthMeters: 30,
    heightMeters: 20,

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
          "corridor-safe",

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

      {
        id:
          "corridor-long-risk",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 10 },
            { x: 20, y: 10 },
            { x: 20, y: 14 },
            { x: 0, y: 14 },
          ],
        },
      },
    ],
  };
}

function createGraph(): NavigationGraph {
  return {
    layoutId:
      "hazard-routing-test",

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
          "exit-safe",

        type:
          "EXIT",

        position: {
          x: 10,
          y: 0,
        },

        zoneId:
          "corridor-safe",
      },

      {
        id:
          "exit-long-risk",

        type:
          "EXIT",

        position: {
          x: 15,
          y: 0,
        },

        zoneId:
          "corridor-long-risk",
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

        lengthMeters: 5,

        widthMeters: 2,

        zoneId:
          "corridor-short",

        bidirectional: true,
      },

      {
        id:
          "edge-safe",

        from:
          "start",

        to:
          "exit-safe",

        lengthMeters: 10,

        widthMeters: 3,

        zoneId:
          "corridor-safe",

        bidirectional: true,
      },

      {
        id:
          "edge-long-risk",

        from:
          "start",

        to:
          "exit-long-risk",

        lengthMeters: 15,

        widthMeters: 3,

        zoneId:
          "corridor-long-risk",

        bidirectional: true,
      },
    ],
  };
}

function createExits(): ExitSet {
  return {
    layoutId:
      "hazard-routing-test",

    exits: [
      {
        id:
          "exit-short",

        position: {
          x: 5,
          y: 0,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-short",
      },

      {
        id:
          "exit-safe",

        position: {
          x: 10,
          y: 0,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-safe",
      },

      {
        id:
          "exit-long-risk",

        position: {
          x: 15,
          y: 0,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-long-risk",
      },
    ],
  };
}

function createScenario(): ScenarioInstance {
  return {
    id:
      "hazard-routing-scenario",

    seed: 1042,

    layoutId:
      "hazard-routing-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "block-safe-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds: 5,

        targetId:
          "exit-safe",
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
  "Hazard-Aware routing policy",
  () => {
    it("selects the shortest travel-time route when all routes are CLEAR", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
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

    it("prefers a longer CLEAR route over a shorter RISK route", () => {
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
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-safe",
      );

      expect(
        decision?.predictedRiskExposureSeconds,
      ).toBe(0);
    });

    it("uses travel time as the secondary criterion when risk exposure is equal", () => {
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
        "corridor-safe",
        "RISK",
      );

      hazardField.setZoneState(
        "corridor-long-risk",
        "RISK",
      );

      const decision =
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-short",
      );
    });

    it("reports predicted risk exposure for a RISK route", () => {
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
        "corridor-safe",
        "BLOCKED",
      );

      hazardField.setZoneState(
        "corridor-long-risk",
        "BLOCKED",
      );

      const decision =
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-short",
      );

      expect(
        decision?.predictedRiskExposureSeconds,
      ).toBeGreaterThan(0);

      expect(
        decision?.predictedRiskExposureSeconds,
      ).toBeCloseTo(
        decision!
          .estimatedTravelTimeSeconds,
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
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-safe",
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

      hazardField.setZoneState(
        "corridor-short",
        "RISK",
      );

      disruptions.processDueEvents(
        5,
      );

      const decision =
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      /**
       * exit-safe would otherwise be the preferred zero-risk
       * route, but it is dynamically unavailable.
       */
      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-long-risk",
      );
    });

    it("returns null when every route is BLOCKED", () => {
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
        "corridor-safe",
        "BLOCKED",
      );

      hazardField.setZoneState(
        "corridor-long-risk",
        "BLOCKED",
      );

      const decision =
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision,
      ).toBeNull();
    });

    it("returns zero costs when already at an available exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByHazardAwarePolicy(
          "exit-safe",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-safe",
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

    it("does not use future disruption information", () => {
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

      /**
       * exit-safe is scheduled to close at t=5, but the event
       * has not been applied yet. The policy therefore still
       * considers it available.
       */
      const decision =
        routeByHazardAwarePolicy(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-safe",
      );
    });

    it("rejects invalid start nodes and incompatible layouts", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(() =>
        routeByHazardAwarePolicy(
          "missing-node",
          graph,
          exits,
          hazardField,
          disruptions,
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
        routeByHazardAwarePolicy(
          "start",
          wrongGraph,
          exits,
          hazardField,
          disruptions,
        ),
      ).toThrow(
        /must use the same layout/,
      );
    });
  },
);