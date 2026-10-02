import {
  describe,
  expect,
  it,
} from "vitest";

import { DynamicDisruptionController } from "../../src/core/DynamicDisruptionController";
import {
  completeEvacuationAtCurrentNode,
  findReachableAvailableExitIds,
  getAvailableExitIds,
  markAgentUnreachableIfNoExit,
  updateAgentEvacuationState,
} from "../../src/core/evacuationState";
import { HazardField } from "../../src/core/HazardField";

import type { AgentState } from "../../src/types/agent";
import type { BuildingEnvironment } from "../../src/types/environment";
import type { ExitSet } from "../../src/types/exit";
import type { NavigationGraph } from "../../src/types/navigation";
import type { ScenarioInstance } from "../../src/types/scenario";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId:
      "evacuation-test",

    widthMeters: 20,
    heightMeters: 10,

    zones: [
      {
        id:
          "corridor-west",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 3 },
            { x: 0, y: 3 },
          ],
        },
      },

      {
        id:
          "corridor-east",

        type:
          "CORRIDOR",

        polygon: {
          vertices: [
            { x: 10, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 3 },
            { x: 10, y: 3 },
          ],
        },
      },
    ],
  };
}

function createGraph(): NavigationGraph {
  return {
    layoutId:
      "evacuation-test",

    nodes: [
      {
        id:
          "exit-west",

        type:
          "EXIT",

        position: {
          x: 0,
          y: 1.5,
        },

        zoneId:
          "corridor-west",
      },

      {
        id:
          "node-center",

        type:
          "DECISION_POINT",

        position: {
          x: 10,
          y: 1.5,
        },

        zoneId:
          "corridor-west",
      },

      {
        id:
          "exit-east",

        type:
          "EXIT",

        position: {
          x: 20,
          y: 1.5,
        },

        zoneId:
          "corridor-east",
      },
    ],

    edges: [
      {
        id:
          "edge-center-west",

        from:
          "node-center",

        to:
          "exit-west",

        lengthMeters: 10,
        widthMeters: 2,

        zoneId:
          "corridor-west",

        bidirectional: true,
      },

      {
        id:
          "edge-center-east",

        from:
          "node-center",

        to:
          "exit-east",

        lengthMeters: 10,
        widthMeters: 2,

        zoneId:
          "corridor-east",

        bidirectional: true,
      },
    ],
  };
}

function createExits(): ExitSet {
  return {
    layoutId:
      "evacuation-test",

    exits: [
      {
        id:
          "exit-west",

        position: {
          x: 0,
          y: 1.5,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-west",
      },

      {
        id:
          "exit-east",

        position: {
          x: 20,
          y: 1.5,
        },

        widthMeters: 1.8,

        connectedZoneId:
          "corridor-east",
      },
    ],
  };
}

function createScenario(): ScenarioInstance {
  return {
    id:
      "evacuation-state-test",

    seed: 1042,

    layoutId:
      "evacuation-test",

    parameterSetVersion:
      "test-v1",

    occupants: [],

    disruptionSchedule: [
      {
        id:
          "block-east-exit",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          5,

        targetId:
          "exit-east",
      },
    ],
  };
}

function createAgent(
  nodeId = "node-center",
): AgentState {
  const graph =
    createGraph();

  const node =
    graph.nodes.find(
      (candidate) =>
        candidate.id === nodeId,
    );

  if (!node) {
    throw new Error(
      `Missing test node: ${nodeId}`,
    );
  }

  return {
    id:
      "agent-001",

    desiredSpeedMps:
      1.3,

    position: {
      x: node.position.x,
      y: node.position.y,
    },

    status:
      "ACTIVE",

    currentNodeId:
      nodeId,

    currentEdgeId:
      null,

    routeNodeIds: [],

    routeCursorIndex:
      0,

    targetExitId:
      null,

    rerouteCount:
      0,

    distanceTraveledMeters:
      0,

    hazardExposureSeconds:
      0,

    evacuationTimeSeconds:
      null,
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
  "Evacuation-state handling",
  () => {
    it("reports all unblocked exits as available", () => {
      const {
        exits,
        disruptions,
      } =
        createSystem();

      expect(
        getAvailableExitIds(
          exits,
          disruptions,
        ),
      ).toEqual([
        "exit-west",
        "exit-east",
      ]);
    });

    it("removes a dynamically blocked exit from the available set", () => {
      const {
        exits,
        disruptions,
      } =
        createSystem();

      disruptions.processDueEvents(
        5,
      );

      expect(
        getAvailableExitIds(
          exits,
          disruptions,
        ),
      ).toEqual([
        "exit-west",
      ]);
    });

    it("finds all reachable available exits under normal conditions", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(
        findReachableAvailableExitIds(
          "node-center",
          graph,
          exits,
          hazardField,
          disruptions,
        ),
      ).toEqual([
        "exit-west",
        "exit-east",
      ]);
    });

    it("excludes exits whose route has become BLOCKED", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-east",
        "BLOCKED",
      );

      expect(
        findReachableAvailableExitIds(
          "node-center",
          graph,
          exits,
          hazardField,
          disruptions,
        ),
      ).toEqual([
        "exit-west",
      ]);
    });

    it("marks an agent EVACUATED at an available exit", () => {
      const {
        graph,
        exits,
        disruptions,
      } =
        createSystem();

      const agent =
        createAgent(
          "exit-west",
        );

      const completed =
        completeEvacuationAtCurrentNode(
          agent,
          graph,
          exits,
          disruptions,
          12.5,
        );

      expect(completed).toBe(
        true,
      );

      expect(
        agent.status,
      ).toBe(
        "EVACUATED",
      );

      expect(
        agent.targetExitId,
      ).toBe(
        "exit-west",
      );

      expect(
        agent.evacuationTimeSeconds,
      ).toBeCloseTo(
        12.5,
      );
    });

    it("does not evacuate an agent through a blocked exit", () => {
      const {
        graph,
        exits,
        disruptions,
      } =
        createSystem();

      disruptions.processDueEvents(
        5,
      );

      const agent =
        createAgent(
          "exit-east",
        );

      const completed =
        completeEvacuationAtCurrentNode(
          agent,
          graph,
          exits,
          disruptions,
          6,
        );

      expect(completed).toBe(
        false,
      );

      expect(
        agent.status,
      ).toBe(
        "ACTIVE",
      );

      expect(
        agent.evacuationTimeSeconds,
      ).toBeNull();
    });

    it("keeps an agent ACTIVE while at least one available exit remains reachable", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-east",
        "BLOCKED",
      );

      const agent =
        createAgent();

      const marked =
        markAgentUnreachableIfNoExit(
          agent,
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(marked).toBe(
        false,
      );

      expect(
        agent.status,
      ).toBe(
        "ACTIVE",
      );
    });

    it("marks an agent UNREACHABLE when every exit route is unavailable", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-west",
        "BLOCKED",
      );

      hazardField.setZoneState(
        "corridor-east",
        "BLOCKED",
      );

      const agent =
        createAgent();

      const marked =
        markAgentUnreachableIfNoExit(
          agent,
          graph,
          exits,
          hazardField,
          disruptions,
        );

      expect(marked).toBe(
        true,
      );

      expect(
        agent.status,
      ).toBe(
        "UNREACHABLE",
      );

      expect(
        agent.targetExitId,
      ).toBeNull();

      expect(
        agent.evacuationTimeSeconds,
      ).toBeNull();
    });

    it("performs evacuation before unreachable evaluation when an agent is already at an available exit", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      hazardField.setZoneState(
        "corridor-west",
        "BLOCKED",
      );

      const agent =
        createAgent(
          "exit-west",
        );

      const result =
        updateAgentEvacuationState(
          agent,
          graph,
          exits,
          hazardField,
          disruptions,
          20,
        );

      expect(result).toBe(
        "EVACUATED",
      );

      expect(
        agent.status,
      ).toBe(
        "EVACUATED",
      );
    });

    it("rejects invalid evacuation time and incompatible layouts", () => {
      const {
        graph,
        exits,
        hazardField,
        disruptions,
      } =
        createSystem();

      expect(() =>
        completeEvacuationAtCurrentNode(
          createAgent(
            "exit-west",
          ),
          graph,
          exits,
          disruptions,
          -1,
        ),
      ).toThrow(
        /Evacuation time must be non-negative/,
      );

      const wrongGraph:
        NavigationGraph = {
        ...graph,

        layoutId:
          "wrong-layout",
      };

      expect(() =>
        findReachableAvailableExitIds(
          "node-center",
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