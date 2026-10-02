import {
  describe,
  expect,
  it,
} from "vitest";

import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";
import { routeByStaticShortestPath } from "../../src/core/staticShortestPathPolicy";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "static-shortest-test",

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
            { x: 10, y: 0 },
            { x: 10, y: 5 },
            { x: 0, y: 5 },
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
            { x: 20, y: 10 },
            { x: 0, y: 10 },
          ],
        },
      },
    ],
  };
}

function createGraph(): NavigationGraph {
  return {
    layoutId:
      "static-shortest-test",

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
          "near-detour",

        type:
          "JUNCTION",

        position: {
          x: 5,
          y: 5,
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
      /**
       * exit-near is geometrically closest, but its network
       * route is intentionally long.
       */
      {
        id:
          "edge-start-near-detour",

        from:
          "start",

        to:
          "near-detour",

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
          "edge-near-detour-exit",

        from:
          "near-detour",

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

      /**
       * exit-far is farther in Euclidean distance but only
       * 4 m away through the navigation network.
       */
      {
        id:
          "edge-start-far",

        from:
          "start",

        to:
          "exit-far",

        lengthMeters:
          4,

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

function createExits(): ExitSet {
  return {
    layoutId:
      "static-shortest-test",

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

function createScenario(): ScenarioInstance {
  return {
    id:
      "static-shortest-scenario",

    seed:
      1042,

    layoutId:
      "static-shortest-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "block-far-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          5,

        targetId:
          "exit-far",
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
  "Static Shortest Path policy",
  () => {
    it("selects the exit with the shortest network distance", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByStaticShortestPath(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-far",
      );

      expect(
        decision?.networkDistanceMeters,
      ).toBe(4);
    });

    it("does not select the geometrically nearest exit when its network path is longer", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByStaticShortestPath(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).not.toBe(
        "exit-near",
      );

      expect(
        decision?.path.edgeIds,
      ).toEqual([
        "edge-start-far",
      ]);
    });

    it("reports network distance as the routing cost", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByStaticShortestPath(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.path.totalCost,
      ).toBe(4);

      expect(
        decision?.networkDistanceMeters,
      ).toBe(
        decision?.path.totalCost,
      );
    });

    it("does not penalize RISK corridors", () => {
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

      const decision =
        routeByStaticShortestPath(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-far",
      );
    });

    it("avoids a physically BLOCKED corridor", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-far",
        "BLOCKED",
      );

      const decision =
        routeByStaticShortestPath(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-near",
      );

      expect(
        decision?.networkDistanceMeters,
      ).toBe(20);
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
        routeByStaticShortestPath(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-near",
      );
    });

    it("returns null when no available exit can be reached", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-near",
        "BLOCKED",
      );

      hazardField.setZoneState(
        "corridor-far",
        "BLOCKED",
      );

      const decision =
        routeByStaticShortestPath(
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

    it("returns a zero-distance path when already at an available exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeByStaticShortestPath(
          "exit-far",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-far",
      );

      expect(
        decision?.networkDistanceMeters,
      ).toBe(0);

      expect(
        decision?.path.nodeIds,
      ).toEqual([
        "exit-far",
      ]);

      expect(
        decision?.path.edgeIds,
      ).toEqual([]);
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
        routeByStaticShortestPath(
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
        routeByStaticShortestPath(
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