import {
  describe,
  expect,
  it,
} from "vitest";

import { HazardField } from "../../src/core/HazardField";

import type { AgentState } from "../../src/types/agent";
import type { BuildingEnvironment } from "../../src/types/environment";
import type { NavigationGraph } from "../../src/types/navigation";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId: "hazard-test",

    widthMeters: 20,
    heightMeters: 10,

    zones: [
      {
        id: "corridor-a",
        type: "CORRIDOR",

        polygon: {
          vertices: [
            {
              x: 0,
              y: 0,
            },
            {
              x: 10,
              y: 0,
            },
            {
              x: 10,
              y: 3,
            },
            {
              x: 0,
              y: 3,
            },
          ],
        },
      },

      {
        id: "corridor-b",
        type: "CORRIDOR",

        polygon: {
          vertices: [
            {
              x: 10,
              y: 0,
            },
            {
              x: 20,
              y: 0,
            },
            {
              x: 20,
              y: 3,
            },
            {
              x: 10,
              y: 3,
            },
          ],
        },
      },

      {
        id: "room-a",
        type: "ROOM",

        polygon: {
          vertices: [
            {
              x: 0,
              y: 3,
            },
            {
              x: 5,
              y: 3,
            },
            {
              x: 5,
              y: 8,
            },
            {
              x: 0,
              y: 8,
            },
          ],
        },
      },
    ],
  };
}

function createGraph(): NavigationGraph {
  return {
    layoutId: "hazard-test",

    nodes: [
      {
        id: "node-a",
        type: "JUNCTION",

        position: {
          x: 0,
          y: 1.5,
        },

        zoneId:
          "corridor-a",
      },

      {
        id: "node-b",
        type: "JUNCTION",

        position: {
          x: 10,
          y: 1.5,
        },

        zoneId:
          "corridor-a",
      },

      {
        id: "node-c",
        type: "JUNCTION",

        position: {
          x: 20,
          y: 1.5,
        },

        zoneId:
          "corridor-b",
      },
    ],

    edges: [
      {
        id: "edge-a-b",

        from: "node-a",
        to: "node-b",

        lengthMeters: 10,
        widthMeters: 3,

        zoneId:
          "corridor-a",

        bidirectional: true,
      },

      {
        id: "edge-b-c",

        from: "node-b",
        to: "node-c",

        lengthMeters: 10,
        widthMeters: 3,

        zoneId:
          "corridor-b",

        bidirectional: true,
      },
    ],
  };
}

function createAgent(): AgentState {
  return {
    id: "agent-001",

    desiredSpeedMps: 1.3,

    position: {
      x: 5,
      y: 1.5,
    },

    status: "ACTIVE",

    currentNodeId:
      "node-a",

    currentEdgeId:
      "edge-a-b",

    routeNodeIds: [],

    routeCursorIndex: 0,

    targetExitId: null,

    rerouteCount: 0,

    distanceTraveledMeters: 0,

    hazardExposureSeconds: 0,

    evacuationTimeSeconds: null,
  };
}

describe("Hazard field", () => {
  it("initializes every building zone as CLEAR", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    expect(
      field.getZoneState(
        "corridor-a",
      ),
    ).toBe("CLEAR");

    expect(
      field.getZoneState(
        "corridor-b",
      ),
    ).toBe("CLEAR");

    expect(
      field.getZoneState(
        "room-a",
      ),
    ).toBe("CLEAR");
  });

  it("allows zone hazard states to change explicitly", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    field.setZoneState(
      "corridor-a",
      "RISK",
    );

    expect(
      field.getZoneState(
        "corridor-a",
      ),
    ).toBe("RISK");

    field.setZoneState(
      "corridor-a",
      "BLOCKED",
    );

    expect(
      field.getZoneState(
        "corridor-a",
      ),
    ).toBe("BLOCKED");
  });

  it("treats CLEAR and RISK as traversable but BLOCKED as unavailable", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    expect(
      field.isZoneTraversable(
        "corridor-a",
      ),
    ).toBe(true);

    field.setZoneState(
      "corridor-a",
      "RISK",
    );

    expect(
      field.isZoneTraversable(
        "corridor-a",
      ),
    ).toBe(true);

    field.setZoneState(
      "corridor-a",
      "BLOCKED",
    );

    expect(
      field.isZoneTraversable(
        "corridor-a",
      ),
    ).toBe(false);
  });

  it("uses an edge's associated zone to determine edge availability", () => {
    const environment =
      createEnvironment();

    const graph =
      createGraph();

    const field =
      new HazardField(
        environment,
      );

    const firstEdge =
      graph.edges[0]!;

    const secondEdge =
      graph.edges[1]!;

    field.setZoneState(
      "corridor-a",
      "BLOCKED",
    );

    expect(
      field.isEdgeTraversable(
        firstEdge,
      ),
    ).toBe(false);

    expect(
      field.isEdgeTraversable(
        secondEdge,
      ),
    ).toBe(true);
  });

  it("accumulates exposure while an active agent traverses a RISK zone", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    const graph =
      createGraph();

    const agent =
      createAgent();

    field.setZoneState(
      "corridor-a",
      "RISK",
    );

    const addedExposure =
      field.accumulateAgentExposure(
        agent,
        graph,
        0.5,
      );

    expect(
      addedExposure,
    ).toBeCloseTo(0.5);

    expect(
      agent.hazardExposureSeconds,
    ).toBeCloseTo(0.5);

    field.accumulateAgentExposure(
      agent,
      graph,
      0.25,
    );

    expect(
      agent.hazardExposureSeconds,
    ).toBeCloseTo(0.75);
  });

  it("does not accumulate exposure in CLEAR zones", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    const agent =
      createAgent();

    const addedExposure =
      field.accumulateAgentExposure(
        agent,
        createGraph(),
        1,
      );

    expect(
      addedExposure,
    ).toBe(0);

    expect(
      agent.hazardExposureSeconds,
    ).toBe(0);
  });

  it("does not accumulate exposure for inactive agents", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    const agent =
      createAgent();

    agent.status =
      "EVACUATED";

    field.setZoneState(
      "corridor-a",
      "RISK",
    );

    const addedExposure =
      field.accumulateAgentExposure(
        agent,
        createGraph(),
        1,
      );

    expect(
      addedExposure,
    ).toBe(0);

    expect(
      agent.hazardExposureSeconds,
    ).toBe(0);
  });

  it("creates deterministic snapshots and supports reset", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    field.setZoneState(
      "corridor-a",
      "RISK",
    );

    field.setZoneState(
      "corridor-b",
      "BLOCKED",
    );

    expect(
      field.createSnapshot(),
    ).toEqual({
      layoutId:
        "hazard-test",

      zones: [
        {
          zoneId:
            "corridor-a",

          state:
            "RISK",
        },

        {
          zoneId:
            "corridor-b",

          state:
            "BLOCKED",
        },

        {
          zoneId:
            "room-a",

          state:
            "CLEAR",
        },
      ],
    });

    field.resetZone(
      "corridor-a",
    );

    expect(
      field.getZoneState(
        "corridor-a",
      ),
    ).toBe("CLEAR");

    expect(
      field.getZoneState(
        "corridor-b",
      ),
    ).toBe("BLOCKED");

    field.resetAll();

    expect(
      field.getZoneState(
        "corridor-a",
      ),
    ).toBe("CLEAR");

    expect(
      field.getZoneState(
        "corridor-b",
      ),
    ).toBe("CLEAR");
  });

  it("rejects unknown zones, invalid timesteps, and layout mismatches", () => {
    const field =
      new HazardField(
        createEnvironment(),
      );

    expect(() =>
      field.getZoneState(
        "missing-zone",
      ),
    ).toThrow(
      /Unknown hazard zone/,
    );

    expect(() =>
      field.setZoneState(
        "missing-zone",
        "RISK",
      ),
    ).toThrow(
      /Unknown hazard zone/,
    );

    expect(() =>
      field.accumulateAgentExposure(
        createAgent(),
        createGraph(),
        0,
      ),
    ).toThrow(
      /timestep must be positive/,
    );

    const wrongGraph: NavigationGraph = {
      ...createGraph(),

      layoutId:
        "wrong-layout",
    };

    expect(() =>
      field.accumulateAgentExposure(
        createAgent(),
        wrongGraph,
        1,
      ),
    ).toThrow(
      /layout must match/,
    );
  });
});