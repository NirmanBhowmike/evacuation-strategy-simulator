import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateDensitySnapshot,
} from "../../src/core/calculateDensity";

import {
  calculateAgentEffectiveSpeedMps,
  calculateCongestionSpeedFactor,
  calculateWeidmannSpeedMps,
  getAgentLocalDensity,
  WEIDMANN_FREE_FLOW_SPEED_MPS,
  WEIDMANN_JAM_DENSITY_PPM2,
} from "../../src/core/congestionEffects";

import type {
  AgentState,
} from "../../src/types/agent";

import type {
  DensitySnapshot,
} from "../../src/types/density";

import type {
  NavigationGraph,
} from "../../src/types/navigation";

function createGraph():
  NavigationGraph {
  return {
    layoutId:
      "congestion-test",

    nodes: [
      {
        id:
          "node-a",

        type:
          "JUNCTION",

        position: {
          x:
            0,

          y:
            0,
        },

        zoneId:
          "corridor-a",
      },

      {
        id:
          "node-b",

        type:
          "JUNCTION",

        position: {
          x:
            5,

          y:
            0,
        },

        zoneId:
          "corridor-a",
      },
    ],

    edges: [
      {
        id:
          "edge-a-b",

        from:
          "node-a",

        to:
          "node-b",

        lengthMeters:
          5,

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

function createBalancedGraph():
  NavigationGraph {
  return {
    layoutId:
      "layout-a-architecture-v2",

    nodes: [
      {
        id:
          "node-a",

        type:
          "JUNCTION",

        position: {
          x:
            0,

          y:
            0,
        },

        zoneId:
          "corridor-a",
      },

      {
        id:
          "node-b",

        type:
          "JUNCTION",

        position: {
          x:
            4.005,

          y:
            0,
        },

        zoneId:
          "corridor-a",
      },
    ],

    edges: [
      {
        id:
          "edge-a-b",

        from:
          "node-a",

        to:
          "node-b",

        lengthMeters:
          4.005,

        widthMeters:
          1.35,

        zoneId:
          "corridor-a",

        bidirectional:
          true,
      },
    ],
  };
}

function createAgent(
  desiredSpeedMps =
    1.34,
  x =
    0.5,
): AgentState {
  return {
    id:
      "agent-001",

    desiredSpeedMps,

    position: {
      x,

      y:
        0,
    },

    status:
      "ACTIVE",

    currentNodeId:
      "node-a",

    currentEdgeId:
      "edge-a-b",

    routeNodeIds:
      [],

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

function createSnapshot(
  density:
    number,
): DensitySnapshot {
  return {
    cellLengthMeters:
      1,

    cells: [
      {
        edgeId:
          "edge-a-b",

        cellIndex:
          0,

        startDistanceMeters:
          0,

        lengthMeters:
          1,

        widthMeters:
          2,

        occupantCount:
          0,

        densityPersonsPerSquareMeter:
          density,
      },

      {
        edgeId:
          "edge-a-b",

        cellIndex:
          1,

        startDistanceMeters:
          1,

        lengthMeters:
          1,

        widthMeters:
          2,

        occupantCount:
          0,

        densityPersonsPerSquareMeter:
          2,
      },

      {
        edgeId:
          "edge-a-b",

        cellIndex:
          2,

        startDistanceMeters:
          2,

        lengthMeters:
          1,

        widthMeters:
          2,

        occupantCount:
          0,

        densityPersonsPerSquareMeter:
          3,
      },

      {
        edgeId:
          "edge-a-b",

        cellIndex:
          3,

        startDistanceMeters:
          3,

        lengthMeters:
          1,

        widthMeters:
          2,

        occupantCount:
          0,

        densityPersonsPerSquareMeter:
          4,
      },

      {
        edgeId:
          "edge-a-b",

        cellIndex:
          4,

        startDistanceMeters:
          4,

        lengthMeters:
          1,

        widthMeters:
          2,

        occupantCount:
          0,

        densityPersonsPerSquareMeter:
          5,
      },
    ],
  };
}

describe(
  "Congestion effects",
  () => {
    it(
      "returns free-flow speed at zero density",
      () => {
        expect(
          calculateWeidmannSpeedMps(
            0,
          ),
        ).toBeCloseTo(
          WEIDMANN_FREE_FLOW_SPEED_MPS,
        );
      },
    );

    it(
      "reduces speed as density increases",
      () => {
        const low =
          calculateWeidmannSpeedMps(
            0.5,
          );

        const medium =
          calculateWeidmannSpeedMps(
            2,
          );

        const high =
          calculateWeidmannSpeedMps(
            4,
          );

        expect(
          low,
        ).toBeGreaterThan(
          medium,
        );

        expect(
          medium,
        ).toBeGreaterThan(
          high,
        );
      },
    );

    it(
      "returns zero speed at or above jam density",
      () => {
        expect(
          calculateWeidmannSpeedMps(
            WEIDMANN_JAM_DENSITY_PPM2,
          ),
        ).toBe(
          0,
        );

        expect(
          calculateWeidmannSpeedMps(
            6,
          ),
        ).toBe(
          0,
        );
      },
    );

    it(
      "produces a normalized congestion factor between zero and one",
      () => {
        const factor =
          calculateCongestionSpeedFactor(
            2,
          );

        expect(
          factor,
        ).toBeGreaterThan(
          0,
        );

        expect(
          factor,
        ).toBeLessThan(
          1,
        );
      },
    );

    it(
      "finds the density cell occupied by an agent",
      () => {
        const agent =
          createAgent(
            1.34,
            1.5,
          );

        const density =
          getAgentLocalDensity(
            agent,
            createGraph(),
            createSnapshot(
              0.5,
            ),
          );

        expect(
          density,
        ).toBe(
          2,
        );
      },
    );

    it(
      "returns zero local density when an agent is not traversing an edge",
      () => {
        const agent =
          createAgent();

        agent.currentEdgeId =
          null;

        const density =
          getAgentLocalDensity(
            agent,
            createGraph(),
            createSnapshot(
              2,
            ),
          );

        expect(
          density,
        ).toBe(
          0,
        );
      },
    );

    it(
      "scales each agent's desired speed rather than replacing it",
      () => {
        const graph =
          createGraph();

        const snapshot =
          createSnapshot(
            2,
          );

        const slowerAgent =
          createAgent(
            1.2,
          );

        const fasterAgent =
          createAgent(
            1.6,
          );

        const slowerSpeed =
          calculateAgentEffectiveSpeedMps(
            slowerAgent,
            graph,
            snapshot,
          );

        const fasterSpeed =
          calculateAgentEffectiveSpeedMps(
            fasterAgent,
            graph,
            snapshot,
          );

        expect(
          fasterSpeed,
        ).toBeGreaterThan(
          slowerSpeed,
        );

        expect(
          fasterSpeed /
            slowerSpeed,
        ).toBeCloseTo(
          1.6 /
            1.2,
        );
      },
    );

    it(
      "rejects invalid pedestrian densities",
      () => {
        expect(
          () =>
            calculateWeidmannSpeedMps(
              -1,
            ),
        ).toThrow(
          /density must be non-negative/,
        );
      },
    );

    it(
      "uses balanced-cell boundaries when looking up Architecture V2 local density",
      () => {
        const graph =
          createBalancedGraph();

        /**
         * With a 4.005 m edge and five balanced cells,
         * the first boundary is at approximately 0.801 m.
         *
         * x = 0.90 therefore belongs to balanced cell 1.
         * A legacy 1 m lookup would incorrectly classify it
         * as cell 0.
         */
        const agent =
          createAgent(
            1.34,
            0.90,
          );

        const snapshot =
          calculateDensitySnapshot(
            [
              agent,
            ],
            graph,
            1,
          );

        expect(
          snapshot
            .partitionMode,
        ).toBe(
          "BALANCED",
        );

        const density =
          getAgentLocalDensity(
            agent,
            graph,
            snapshot,
          );

        expect(
          density,
        ).toBeGreaterThan(
          0,
        );

        const occupiedCell =
          snapshot.cells.find(
            (
              cell,
            ) =>
              cell
                .occupantCount ===
              1,
          );

        expect(
          occupiedCell
            ?.cellIndex,
        ).toBe(
          1,
        );

        expect(
          density,
        ).toBeCloseTo(
          occupiedCell
            ?.densityPersonsPerSquareMeter ??
            0,
          10,
        );
      },
    );
  },
);