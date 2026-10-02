import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceAgentAlongCurrentEdge,
  beginEdgeTraversal,
} from "../../src/core/pedestrianMovement";

import type { AgentState } from "../../src/types/agent";
import type { NavigationGraph } from "../../src/types/navigation";

function createGraph(): NavigationGraph {
  return {
    layoutId: "movement-test",

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
          x: 10,
          y: 0,
        },
        zoneId: "corridor-a",
      },

      {
        id: "node-c",
        type: "JUNCTION",
        position: {
          x: 10,
          y: 10,
        },
        zoneId: "corridor-a",
      },
    ],

    edges: [
      {
        id: "edge-a-b",
        from: "node-a",
        to: "node-b",
        lengthMeters: 10,
        widthMeters: 3,
        zoneId: "corridor-a",
        bidirectional: true,
      },

      {
        id: "edge-b-c",
        from: "node-b",
        to: "node-c",
        lengthMeters: 10,
        widthMeters: 3,
        zoneId: "corridor-a",
        bidirectional: false,
      },
    ],
  };
}

function createAgent(): AgentState {
  return {
    id: "agent-001",

    desiredSpeedMps: 2,

    position: {
      x: 0,
      y: 0,
    },

    status: "ACTIVE",

    currentNodeId: "node-a",
    currentEdgeId: null,

    routeNodeIds: [],
    routeCursorIndex: 0,

    targetExitId: null,

    rerouteCount: 0,

    distanceTraveledMeters: 0,

    hazardExposureSeconds: 0,

    evacuationTimeSeconds: null,
  };
}

describe("Pedestrian movement", () => {
  it("begins traversal of an edge connected to the current node", () => {
    const agent = createAgent();

    beginEdgeTraversal(
      agent,
      createGraph(),
      "edge-a-b",
    );

    expect(
      agent.currentEdgeId,
    ).toBe("edge-a-b");

    expect(
      agent.currentNodeId,
    ).toBe("node-a");
  });

  it("moves according to speed multiplied by timestep", () => {
    const graph = createGraph();
    const agent = createAgent();

    beginEdgeTraversal(
      agent,
      graph,
      "edge-a-b",
    );

    const result =
      advanceAgentAlongCurrentEdge(
        agent,
        graph,
        0.5,
      );

    expect(
      result.distanceMovedMeters,
    ).toBeCloseTo(1);

    expect(
      agent.position.x,
    ).toBeCloseTo(1);

    expect(
      agent.position.y,
    ).toBeCloseTo(0);

    expect(
      agent.distanceTraveledMeters,
    ).toBeCloseTo(1);

    expect(
      result.arrivedAtNodeId,
    ).toBeNull();
  });

  it("supports deterministic fixed-timestep movement", () => {
    const graph = createGraph();

    const first = createAgent();
    const second = createAgent();

    beginEdgeTraversal(
      first,
      graph,
      "edge-a-b",
    );

    beginEdgeTraversal(
      second,
      graph,
      "edge-a-b",
    );

    for (
      let i = 0;
      i < 20;
      i += 1
    ) {
      advanceAgentAlongCurrentEdge(
        first,
        graph,
        0.05,
      );

      advanceAgentAlongCurrentEdge(
        second,
        graph,
        0.05,
      );
    }

    expect(first).toEqual(second);

    expect(
      first.position.x,
    ).toBeCloseTo(2);
  });

  it("arrives exactly at the destination node without overshooting", () => {
    const graph = createGraph();
    const agent = createAgent();

    agent.position = {
      x: 9.5,
      y: 0,
    };

    beginEdgeTraversal(
      agent,
      graph,
      "edge-a-b",
    );

    const result =
      advanceAgentAlongCurrentEdge(
        agent,
        graph,
        1,
      );

    expect(
      agent.position,
    ).toEqual({
      x: 10,
      y: 0,
    });

    expect(
      agent.currentNodeId,
    ).toBe("node-b");

    expect(
      agent.currentEdgeId,
    ).toBeNull();

    expect(
      result.arrivedAtNodeId,
    ).toBe("node-b");

    expect(
      result.distanceMovedMeters,
    ).toBeCloseTo(0.5);

    expect(
      result.unusedDistanceMeters,
    ).toBeCloseTo(1.5);
  });

  it("accumulates traveled distance across multiple steps", () => {
    const graph = createGraph();
    const agent = createAgent();

    beginEdgeTraversal(
      agent,
      graph,
      "edge-a-b",
    );

    advanceAgentAlongCurrentEdge(
      agent,
      graph,
      0.5,
    );

    advanceAgentAlongCurrentEdge(
      agent,
      graph,
      0.5,
    );

    advanceAgentAlongCurrentEdge(
      agent,
      graph,
      0.5,
    );

    expect(
      agent.distanceTraveledMeters,
    ).toBeCloseTo(3);

    expect(
      agent.position.x,
    ).toBeCloseTo(3);
  });

  it("supports reverse traversal on bidirectional edges", () => {
    const graph = createGraph();
    const agent = createAgent();

    agent.currentNodeId =
      "node-b";

    agent.position = {
      x: 10,
      y: 0,
    };

    beginEdgeTraversal(
      agent,
      graph,
      "edge-a-b",
    );

    advanceAgentAlongCurrentEdge(
      agent,
      graph,
      1,
    );

    expect(
      agent.position.x,
    ).toBeCloseTo(8);

    expect(
      agent.position.y,
    ).toBeCloseTo(0);
  });

  it("rejects reverse traversal on a one-way edge", () => {
    const graph = createGraph();
    const agent = createAgent();

    agent.currentNodeId =
      "node-c";

    agent.position = {
      x: 10,
      y: 10,
    };

    expect(() =>
      beginEdgeTraversal(
        agent,
        graph,
        "edge-b-c",
      ),
    ).toThrow(
      /cannot traverse.*in reverse/,
    );
  });

  it("rejects invalid movement timestep and negative speed values", () => {
    const graph = createGraph();
    const agent = createAgent();

    beginEdgeTraversal(
      agent,
      graph,
      "edge-a-b",
    );

    expect(() =>
      advanceAgentAlongCurrentEdge(
        agent,
        graph,
        0,
      ),
    ).toThrow(
      /timestep must be positive/,
    );

    expect(() =>
      advanceAgentAlongCurrentEdge(
        agent,
        graph,
        1,
        -1,
      ),
    ).toThrow(
      /speed must be non-negative/,
    );
  });

  it("allows zero effective speed without moving the agent", () => {
    const graph = createGraph();
    const agent = createAgent();

    beginEdgeTraversal(
      agent,
      graph,
      "edge-a-b",
    );

    const result =
      advanceAgentAlongCurrentEdge(
        agent,
        graph,
        1,
        0,
      );

    expect(
      agent.position,
    ).toEqual({
      x: 0,
      y: 0,
    });

    expect(
      agent.currentNodeId,
    ).toBe("node-a");

    expect(
      agent.currentEdgeId,
    ).toBe("edge-a-b");

    expect(
      agent.distanceTraveledMeters,
    ).toBe(0);

    expect(
      result.distanceMovedMeters,
    ).toBe(0);

    expect(
      result.arrivedAtNodeId,
    ).toBeNull();

    expect(
      result.unusedDistanceMeters,
    ).toBe(0);
  });
});