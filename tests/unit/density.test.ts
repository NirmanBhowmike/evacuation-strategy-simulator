import {
  describe,
  expect,
  it,
} from "vitest";

import { calculateDensitySnapshot } from "../../src/core/calculateDensity";

import type { AgentState } from "../../src/types/agent";
import type { NavigationGraph } from "../../src/types/navigation";

function createGraph(): NavigationGraph {
  return {
    layoutId: "density-test",

    nodes: [
      {
        id: "node-a",
        type: "JUNCTION",
        position: {
          x: 0,
          y: 0,
        },
        zoneId: "corridor-a",
      },

      {
        id: "node-b",
        type: "JUNCTION",
        position: {
          x: 5,
          y: 0,
        },
        zoneId: "corridor-a",
      },

      {
        id: "node-c",
        type: "JUNCTION",
        position: {
          x: 7.5,
          y: 0,
        },
        zoneId: "corridor-b",
      },
    ],

    edges: [
      {
        id: "edge-a-b",
        from: "node-a",
        to: "node-b",
        lengthMeters: 5,
        widthMeters: 2,
        zoneId: "corridor-a",
        bidirectional: true,
      },

      {
        id: "edge-b-c",
        from: "node-b",
        to: "node-c",
        lengthMeters: 2.5,
        widthMeters: 1,
        zoneId: "corridor-b",
        bidirectional: true,
      },
    ],
  };
}

function createAgent(
  id: string,
  x: number,
  edgeId: string | null,
  status:
    | "ACTIVE"
    | "EVACUATED"
    | "UNREACHABLE"
    | "TIMEOUT" =
      "ACTIVE",
): AgentState {
  return {
    id,

    desiredSpeedMps: 1.3,

    position: {
      x,
      y: 0,
    },

    status,

    currentNodeId:
      edgeId === null
        ? "node-a"
        : "node-a",

    currentEdgeId: edgeId,

    routeNodeIds: [],
    routeCursorIndex: 0,

    targetExitId: null,

    rerouteCount: 0,
    distanceTraveledMeters: 0,
    hazardExposureSeconds: 0,

    evacuationTimeSeconds: null,
  };
}

describe("Density calculation", () => {
  it("creates network cells using the configured cell length", () => {
    const snapshot =
      calculateDensitySnapshot(
        [],
        createGraph(),
        1,
      );

    const firstEdgeCells =
      snapshot.cells.filter(
        (cell) =>
          cell.edgeId ===
          "edge-a-b",
      );

    expect(
      firstEdgeCells,
    ).toHaveLength(5);

    for (
      const cell of
        firstEdgeCells
    ) {
      expect(
        cell.lengthMeters,
      ).toBeCloseTo(1);
    }
  });

  it("calculates density using occupant count divided by cell area", () => {
    const agents = [
      createAgent(
        "agent-001",
        0.25,
        "edge-a-b",
      ),

      createAgent(
        "agent-002",
        0.75,
        "edge-a-b",
      ),
    ];

    const snapshot =
      calculateDensitySnapshot(
        agents,
        createGraph(),
        1,
      );

    const firstCell =
      snapshot.cells.find(
        (cell) =>
          cell.edgeId ===
            "edge-a-b" &&
          cell.cellIndex === 0,
      );

    expect(firstCell).toBeDefined();

    expect(
      firstCell?.occupantCount,
    ).toBe(2);

    expect(
      firstCell
        ?.densityPersonsPerSquareMeter,
    ).toBeCloseTo(1);
  });

  it("places agents into different cells according to position", () => {
    const agents = [
      createAgent(
        "agent-001",
        0.5,
        "edge-a-b",
      ),

      createAgent(
        "agent-002",
        2.25,
        "edge-a-b",
      ),
    ];

    const snapshot =
      calculateDensitySnapshot(
        agents,
        createGraph(),
        1,
      );

    const occupiedCells =
      snapshot.cells.filter(
        (cell) =>
          cell.edgeId ===
            "edge-a-b" &&
          cell.occupantCount > 0,
      );

    expect(
      occupiedCells,
    ).toHaveLength(2);

    expect(
      occupiedCells.map(
        (cell) =>
          cell.cellIndex,
      ),
    ).toEqual([0, 2]);
  });

  it("handles a shorter final cell correctly", () => {
    const snapshot =
      calculateDensitySnapshot(
        [
          createAgent(
            "agent-001",
            7.4,
            "edge-b-c",
          ),
        ],
        createGraph(),
        1,
      );

    const edgeCells =
      snapshot.cells.filter(
        (cell) =>
          cell.edgeId ===
          "edge-b-c",
      );

    expect(edgeCells).toHaveLength(
      3,
    );

    const finalCell =
      edgeCells[2];

    expect(
      finalCell?.lengthMeters,
    ).toBeCloseTo(0.5);

    expect(
      finalCell?.occupantCount,
    ).toBe(1);

    expect(
      finalCell
        ?.densityPersonsPerSquareMeter,
    ).toBeCloseTo(2);
  });

  it("ignores agents that are not currently traversing an edge", () => {
    const snapshot =
      calculateDensitySnapshot(
        [
          createAgent(
            "agent-001",
            0,
            null,
          ),
        ],
        createGraph(),
        1,
      );

    const totalOccupants =
      snapshot.cells.reduce(
        (
          total,
          cell,
        ) =>
          total +
          cell.occupantCount,
        0,
      );

    expect(
      totalOccupants,
    ).toBe(0);
  });

  it("ignores non-active agents", () => {
    const snapshot =
      calculateDensitySnapshot(
        [
          createAgent(
            "agent-001",
            0.5,
            "edge-a-b",
            "EVACUATED",
          ),
        ],
        createGraph(),
        1,
      );

    const totalOccupants =
      snapshot.cells.reduce(
        (
          total,
          cell,
        ) =>
          total +
          cell.occupantCount,
        0,
      );

    expect(
      totalOccupants,
    ).toBe(0);
  });

  it("supports alternative cell lengths for sensitivity analysis", () => {
    const snapshot =
      calculateDensitySnapshot(
        [],
        createGraph(),
        0.5,
      );

    const firstEdgeCells =
      snapshot.cells.filter(
        (cell) =>
          cell.edgeId ===
          "edge-a-b",
      );

    expect(
      firstEdgeCells,
    ).toHaveLength(10);

    expect(
      snapshot.cellLengthMeters,
    ).toBe(0.5);
  });

  it("rejects invalid cell lengths", () => {
    expect(() =>
      calculateDensitySnapshot(
        [],
        createGraph(),
        0,
      ),
    ).toThrow(
      /cell length must be positive/,
    );

    expect(() =>
      calculateDensitySnapshot(
        [],
        createGraph(),
        -1,
      ),
    ).toThrow(
      /cell length must be positive/,
    );
  });
});