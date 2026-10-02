import {
  describe,
  expect,
  it,
} from "vitest";

import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";
import { routeToNearestExit } from "../../src/core/nearestExitPolicy";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "nearest-exit-test",

    widthMeters: 30,
    heightMeters: 20,

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
      "nearest-exit-test",

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
       * Geometrically nearest exit, but deliberately expensive
       * in network distance.
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
       * Farther exit geometrically, but much shorter network path.
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
      "nearest-exit-test",

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
      "nearest-exit-scenario",

    seed:
      1042,

    layoutId:
      "nearest-exit-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "block-near-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          5,

        targetId:
          "exit-near",
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
  "Nearest Exit policy",
  () => {
    it("selects the Euclidean-nearest exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeToNearestExit(
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
        decision?.straightLineDistanceMeters,
      ).toBeCloseTo(
        2,
      );
    });

    it("chooses the geometrically nearest exit even when its network route is longer", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeToNearestExit(
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
        decision?.path.totalCost,
      ).toBe(
        20,
      );

      /**
       * The farther exit has only a 4 m network route,
       * but Nearest Exit does not optimize network distance
       * when selecting the target.
       */
      expect(
        decision?.path.totalCost,
      ).toBeGreaterThan(
        4,
      );
    });

    it("uses Dijkstra to construct the route to the selected exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const decision =
        routeToNearestExit(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.path.nodeIds,
      ).toEqual([
        "start",
        "near-detour",
        "exit-near",
      ]);

      expect(
        decision?.path.edgeIds,
      ).toEqual([
        "edge-start-near-detour",
        "edge-near-detour-exit",
      ]);
    });

    it("does not avoid a RISK route", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-near",
        "RISK",
      );

      const decision =
        routeToNearestExit(
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

    it("falls back to the next-nearest exit when the nearest route is BLOCKED", () => {
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

      const decision =
        routeToNearestExit(
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
        decision?.path.edgeIds,
      ).toEqual([
        "edge-start-far",
      ]);
    });

    it("does not select a dynamically blocked exit", () => {
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
        routeToNearestExit(
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
        routeToNearestExit(
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

    it("uses deterministic exit-id ordering when straight-line distances tie", () => {
      const {
        environment,
        graph,
        hazardField,
      } =
        createSystem();

      const tiedExits:
        ExitSet = {
        layoutId:
          "nearest-exit-test",

        exits: [
          {
            id:
              "exit-z",

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
              "exit-a",

            position: {
              x: -2,
              y: 0,
            },

            widthMeters:
              1.8,

            connectedZoneId:
              "corridor-near",
          },
        ],
      };

      const tiedGraph:
        NavigationGraph = {
        ...graph,

        nodes: [
          ...graph.nodes.filter(
            (node) =>
              node.type !==
              "EXIT",
          ),

          {
            id:
              "exit-z",

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
              "exit-a",

            type:
              "EXIT",

            position: {
              x: -2,
              y: 0,
            },

            zoneId:
              "corridor-near",
          },
        ],

        edges: [
          {
            id:
              "edge-start-z",

            from:
              "start",

            to:
              "exit-z",

            lengthMeters:
              2,

            widthMeters:
              2,

            zoneId:
              "corridor-near",

            bidirectional:
              true,
          },

          {
            id:
              "edge-start-a",

            from:
              "start",

            to:
              "exit-a",

            lengthMeters:
              2,

            widthMeters:
              2,

            zoneId:
              "corridor-near",

            bidirectional:
              true,
          },
        ],
      };

      const noEvents:
        ScenarioInstance = {
        ...createScenario(),

        disruptionSchedule:
          [],
      };

      const disruptions =
        new DynamicDisruptionController(
          noEvents,
          environment,
          tiedExits,
          hazardField,
        );

      const decision =
        routeToNearestExit(
          "start",
          tiedGraph,
          tiedExits,
          hazardField,
          disruptions,
        );

      expect(
        decision?.targetExitId,
      ).toBe(
        "exit-a",
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
        routeToNearestExit(
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
        routeToNearestExit(
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