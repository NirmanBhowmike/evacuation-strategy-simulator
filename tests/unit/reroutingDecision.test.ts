import {
  describe,
  expect,
  it,
} from "vitest";

import { createRoutingStrategyContext } from "../../src/core/createRoutingStrategyContext";
import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import { HazardField } from "../../src/core/HazardField";
import {
  ADAPTIVE_REROUTE_THRESHOLD_CANDIDATES,
  decideAdaptiveRerouting,
} from "../../src/core/reroutingDecision";

import type { BuildingEnvironment } from "../../src/types/environment";
import type { DensitySnapshot } from "../../src/types/density";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { RoutingPath } from "../../src/types/routing";
import type { RoutingStrategyDecision } from "../../src/types/routingStrategy";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment():
  BuildingEnvironment {
  return {
    layoutId:
      "rerouting-test",

    widthMeters: 30,
    heightMeters: 20,

    zones: [
      {
        id:
          "corridor-current",

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
          "corridor-fast",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 5 },
            { x: 10, y: 5 },
            { x: 10, y: 9 },
            { x: 0, y: 9 },
          ],
        },
      },

      {
        id:
          "corridor-slight",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 10 },
            { x: 12, y: 10 },
            { x: 12, y: 14 },
            { x: 0, y: 14 },
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
      "rerouting-test",

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
          "exit-fast",

        type:
          "EXIT",

        position: {
          x: 8,
          y: 0,
        },

        zoneId:
          "corridor-fast",
      },

      {
        id:
          "exit-slight",

        type:
          "EXIT",

        position: {
          x: 9.5,
          y: 0,
        },

        zoneId:
          "corridor-slight",
      },
    ],

    edges: [
      {
        id:
          "edge-current",

        from:
          "start",

        to:
          "exit-current",

        lengthMeters: 10,

        widthMeters: 2,

        zoneId:
          "corridor-current",

        bidirectional: true,
      },

      {
        id:
          "edge-fast",

        from:
          "start",

        to:
          "exit-fast",

        lengthMeters: 8,

        widthMeters: 2,

        zoneId:
          "corridor-fast",

        bidirectional: true,
      },

      {
        id:
          "edge-slight",

        from:
          "start",

        to:
          "exit-slight",

        lengthMeters: 9.5,

        widthMeters: 2,

        zoneId:
          "corridor-slight",

        bidirectional: true,
      },
    ],
  };
}

function createExits():
  ExitSet {
  return {
    layoutId:
      "rerouting-test",

    exits: [
      {
        id:
          "exit-current",

        position: {
          x: 10,
          y: 0,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-current",
      },

      {
        id:
          "exit-fast",

        position: {
          x: 8,
          y: 0,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-fast",
      },

      {
        id:
          "exit-slight",

        position: {
          x: 9.5,
          y: 0,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-slight",
      },
    ],
  };
}

function createScenario():
  ScenarioInstance {
  return {
    id:
      "rerouting-scenario",

    seed: 1042,

    layoutId:
      "rerouting-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "block-current-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds: 5,

        targetId:
          "exit-current",
      },
    ],
  };
}

function emptyDensity():
  DensitySnapshot {
  return {
    cellLengthMeters: 1,

    cells: [],
  };
}

function pathTo(
  exitId: string,
  edgeId: string,
  cost: number,
): RoutingPath {
  return {
    nodeIds: [
      "start",
      exitId,
    ],

    edgeIds: [
      edgeId,
    ],

    totalCost:
      cost,

    targetNodeId:
      exitId,
  };
}

function currentPath():
  RoutingPath {
  return pathTo(
    "exit-current",
    "edge-current",
    10,
  );
}

function candidate(
  exitId: string,
  edgeId: string,
): RoutingStrategyDecision {
  return {
    strategyId:
      "ADAPTIVE_HYBRID",

    targetExitId:
      exitId,

    path:
      pathTo(
        exitId,
        edgeId,
        0,
      ),

    metrics: {},
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
    graph,
    exits,
    hazardField,
    disruptions,
  };
}

function createContext() {
  const system =
    createSystem();

  const context =
    createRoutingStrategyContext(
      "start",
      system.graph,
      system.exits,
      system.hazardField,
      system.disruptions,
      emptyDensity(),
    );

  return {
    ...system,
    context,
  };
}

describe(
  "Adaptive rerouting decision",
  () => {
    it("defines the planned threshold candidates", () => {
      expect(
        ADAPTIVE_REROUTE_THRESHOLD_CANDIDATES,
      ).toEqual([
        0,
        0.10,
        0.20,
        0.30,
      ]);
    });

    it("does not reroute for a congestion update alone", () => {
      const {
        context,
      } =
        createContext();

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "CONGESTION_UPDATE",

            threshold:
              0.10,

            candidate:
              candidate(
                "exit-fast",
                "edge-fast",
              ),
          },
        );

      expect(
        result.action,
      ).toBe(
        "NOT_EVALUATED",
      );

      expect(
        result.reason,
      ).toBe(
        "CONGESTION_UPDATE_OUTSIDE_DECISION_NODE",
      );
    });

    it("reroutes at a decision node when relative improvement meets the threshold", () => {
      const {
        context,
      } =
        createContext();

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0.10,

            candidate:
              candidate(
                "exit-fast",
                "edge-fast",
              ),
          },
        );

      expect(
        result.action,
      ).toBe(
        "REROUTE",
      );

      expect(
        result.reason,
      ).toBe(
        "IMPROVEMENT_THRESHOLD_MET",
      );

      expect(
        result.relativeImprovement,
      ).toBeCloseTo(
        0.20,
      );
    });

    it("keeps the current route when improvement is below the threshold", () => {
      const {
        context,
      } =
        createContext();

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0.10,

            candidate:
              candidate(
                "exit-slight",
                "edge-slight",
              ),
          },
        );

      expect(
        result.action,
      ).toBe(
        "KEEP_CURRENT",
      );

      expect(
        result.reason,
      ).toBe(
        "IMPROVEMENT_THRESHOLD_NOT_MET",
      );

      expect(
        result.relativeImprovement,
      ).toBeCloseTo(
        0.05,
      );
    });

    it("allows a safer route to override a high time-improvement threshold", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-current",
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

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "HAZARD_CHANGE",

            threshold:
              0.90,

            candidate:
              candidate(
                "exit-slight",
                "edge-slight",
              ),
          },
        );

      expect(
        result.action,
      ).toBe(
        "REROUTE",
      );

      expect(
        result.reason,
      ).toBe(
        "SAFER_ALTERNATIVE",
      );
    });

    it("does not voluntarily switch to a less-safe route even when it is faster", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-fast",
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

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0,

            candidate:
              candidate(
                "exit-fast",
                "edge-fast",
              ),
          },
        );

      expect(
        result.action,
      ).toBe(
        "KEEP_CURRENT",
      );

      expect(
        result.reason,
      ).toBe(
        "CANDIDATE_LESS_SAFE",
      );
    });

    it("forces rerouting when the current route becomes BLOCKED", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-current",
        "BLOCKED",
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

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "HAZARD_CHANGE",

            threshold:
              1,

            candidate:
              candidate(
                "exit-slight",
                "edge-slight",
              ),
          },
        );

      expect(
        result.action,
      ).toBe(
        "REROUTE",
      );

      expect(
        result.reason,
      ).toBe(
        "CURRENT_ROUTE_BLOCKED",
      );
    });

    it("forces rerouting when the current target exit becomes unavailable", () => {
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

      const context =
        createRoutingStrategyContext(
          "start",
          graph,
          exits,
          hazardField,
          disruptions,
          emptyDensity(),
        );

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              1,

            candidate:
              candidate(
                "exit-slight",
                "edge-slight",
              ),
          },
        );

      expect(
        result.action,
      ).toBe(
        "REROUTE",
      );

      expect(
        result.reason,
      ).toBe(
        "CURRENT_EXIT_UNAVAILABLE",
      );
    });

    it("reports no feasible alternative when a forced change has no candidate route", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-current",
        "BLOCKED",
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

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "HAZARD_CHANGE",

            threshold:
              0.20,

            candidate:
              null,
          },
        );

      expect(
        result.action,
      ).toBe(
        "NO_FEASIBLE_ALTERNATIVE",
      );

      expect(
        result.reason,
      ).toBe(
        "NO_FEASIBLE_ALTERNATIVE",
      );
    });

    it("does not count an identical route as a reroute", () => {
      const {
        context,
      } =
        createContext();

      const sameCandidate:
        RoutingStrategyDecision = {
        strategyId:
          "ADAPTIVE_HYBRID",

        targetExitId:
          "exit-current",

        path:
          currentPath(),

        metrics: {},
      };

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0,

            candidate:
              sameCandidate,
          },
        );

      expect(
        result.action,
      ).toBe(
        "KEEP_CURRENT",
      );

      expect(
        result.reason,
      ).toBe(
        "SAME_ROUTE",
      );

      expect(
        result.relativeImprovement,
      ).toBe(0);
    });

    it("uses the defined relative-improvement formula", () => {
      const {
        context,
      } =
        createContext();

      const result =
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0,

            candidate:
              candidate(
                "exit-fast",
                "edge-fast",
              ),
          },
        );

      const expected =
        (
          result.current
            .estimatedTravelTimeSeconds -
          result.candidate!
            .estimatedTravelTimeSeconds
        ) /
        result.current
          .estimatedTravelTimeSeconds;

      expect(
        result.relativeImprovement,
      ).toBeCloseTo(
        expected,
      );
    });

    it("rejects invalid thresholds and malformed current paths", () => {
      const {
        context,
      } =
        createContext();

      expect(() =>
        decideAdaptiveRerouting(
          context,
          currentPath(),
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              -0.1,

            candidate:
              candidate(
                "exit-fast",
                "edge-fast",
              ),
          },
        ),
      ).toThrow(
        /threshold.*between 0 and 1/,
      );

      const malformed:
        RoutingPath = {
        nodeIds: [
          "start",
          "exit-current",
        ],

        edgeIds: [],

        totalCost: 0,

        targetNodeId:
          "exit-current",
      };

      expect(() =>
        decideAdaptiveRerouting(
          context,
          malformed,
          {
            trigger:
              "DECISION_NODE_REVIEW",

            threshold:
              0.20,

            candidate:
              null,
          },
        ),
      ).toThrow(
        /one fewer edge than nodes/,
      );
    });
  },
);