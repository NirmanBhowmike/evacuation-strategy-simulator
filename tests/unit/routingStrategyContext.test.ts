import {
  describe,
  expect,
  it,
} from "vitest";

import { createRoutingStrategyContext } from "../../src/core/createRoutingStrategyContext";
import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { DensitySnapshot } from "../../src/types/density";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment():
  BuildingEnvironment {
  return {
    layoutId:
      "strategy-context-test",

    widthMeters: 20,
    heightMeters: 10,

    zones: [
      {
        id:
          "corridor-a",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 4 },
            { x: 0, y: 4 },
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
      "strategy-context-test",

    nodes: [
      {
        id:
          "start",

        type:
          "DECISION_POINT",

        position: {
          x: 0,
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
          x: 20,
          y: 2,
        },

        zoneId:
          "corridor-a",
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
          20,

        widthMeters:
          2,

        zoneId:
          "corridor-a",

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
      "strategy-context-test",

    exits: [
      {
        id:
          "exit-a",

        position: {
          x: 20,
          y: 2,
        },

        widthMeters:
          1.8,

        connectedZoneId:
          "corridor-a",
      },
    ],
  };
}

function createScenario():
  ScenarioInstance {
  return {
    id:
      "strategy-context-scenario",

    seed:
      1042,

    layoutId:
      "strategy-context-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    /**
     * This future event must never appear in the strategy
     * context until it has actually been processed.
     */
    disruptionSchedule: [
      {
        id:
          "future-exit-block",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          100,

        targetId:
          "exit-a",
      },
    ],
  };
}

function createDensity():
  DensitySnapshot {
  return {
    cellLengthMeters:
      1,

    cells: [
      {
        edgeId:
          "edge-a",

        cellIndex:
          0,

        startDistanceMeters:
          0,

        lengthMeters:
          1,

        widthMeters:
          2,

        occupantCount:
          2,

        densityPersonsPerSquareMeter:
          1,
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
  "Routing strategy context",
  () => {
    it("contains the common static and current-state routing inputs", () => {
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
          createDensity(),
          {
            "edge-a":
              2.5,
          },
        );

      expect(
        context.layoutId,
      ).toBe(
        "strategy-context-test",
      );

      expect(
        context.startNodeId,
      ).toBe("start");

      expect(
        context.graph,
      ).toBe(graph);

      expect(
        context.exits,
      ).toBe(exits);

      expect(
        context.current
          .queueDelayByEdge[
          "edge-a"
        ],
      ).toBe(2.5);
    });

    it("exposes current hazard state", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-a",
        "RISK",
      );

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createDensity(),
        );

      expect(
        context.current
          .hazardZones,
      ).toEqual([
        {
          zoneId:
            "corridor-a",

          state:
            "RISK",
        },
      ]);
    });

    it("does not reveal a future exit blockage before the event is processed", () => {
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
          createDensity(),
        );

      expect(
        context.current
          .blockedExitIds,
      ).toEqual([]);
    });

    it("reveals an exit blockage only after the disruption becomes current state", () => {
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
          createDensity(),
        );

      expect(
        context.current
          .blockedExitIds,
      ).toEqual([
        "exit-a",
      ]);
    });

    it("does not expose the disruption controller or future schedule through the context", () => {
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
          createDensity(),
        );

      const unknownContext =
        context as unknown as
          Record<
            string,
            unknown
          >;

      expect(
        unknownContext[
          "disruptions"
        ],
      ).toBeUndefined();

      expect(
        unknownContext[
          "scenario"
        ],
      ).toBeUndefined();

      expect(
        unknownContext[
          "disruptionSchedule"
        ],
      ).toBeUndefined();
    });

    it("copies dynamic state so an earlier context does not change with the engine", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const before =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createDensity(),
        );

      hazardField.setZoneState(
        "corridor-a",
        "RISK",
      );

      disruptions.processDueEvents(
        100,
      );

      expect(
        before.current
          .hazardZones[0]
          ?.state,
      ).toBe(
        "CLEAR",
      );

      expect(
        before.current
          .blockedExitIds,
      ).toEqual([]);

      const after =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createDensity(),
        );

      expect(
        after.current
          .hazardZones[0]
          ?.state,
      ).toBe(
        "RISK",
      );

      expect(
        after.current
          .blockedExitIds,
      ).toEqual([
        "exit-a",
      ]);
    });

    it("copies density data instead of retaining the supplied snapshot object", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      const density =
        createDensity();

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          density,
        );

      expect(
        context.current
          .densitySnapshot,
      ).not.toBe(
        density,
      );

      expect(
        context.current
          .densitySnapshot
          .cells,
      ).not.toBe(
        density.cells,
      );

      expect(
        context.current
          .densitySnapshot,
      ).toEqual(
        density,
      );
    });

    it("rejects invalid nodes, layouts, queue delays, and density data", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(() =>
        createRoutingStrategyContext(
          "missing-node",
          graph,
          exits,
          hazardField,
          disruptions,
          createDensity(),
        ),
      ).toThrow(
        /Navigation node not found/,
      );

      expect(() =>
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createDensity(),
          {
            "edge-a": -1,
          },
        ),
      ).toThrow(
        /Queue delay.*non-negative/,
      );

      expect(() =>
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          createDensity(),
          {
            "missing-edge":
              1,
          },
        ),
      ).toThrow(
        /unknown edge/,
      );

      const invalidDensity:
        DensitySnapshot = {
        cellLengthMeters:
          1,

        cells: [
          {
            edgeId:
              "edge-a",

            cellIndex:
              0,

            startDistanceMeters:
              0,

            lengthMeters:
              1,

            widthMeters:
              2,

            occupantCount:
              1,

            densityPersonsPerSquareMeter:
              -1,
          },
        ],
      };

      expect(() =>
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          invalidDensity,
        ),
      ).toThrow(
        /non-negative finite density/,
      );

      const wrongGraph:
        NavigationGraph = {
        ...graph,

        layoutId:
          "wrong-layout",
      };

      expect(() =>
        createRoutingStrategyContext(
          "start",
          wrongGraph,
          exits,
          hazardField,
          disruptions,
          createDensity(),
        ),
      ).toThrow(
        /must use the same layout/,
      );
    });
  },
);