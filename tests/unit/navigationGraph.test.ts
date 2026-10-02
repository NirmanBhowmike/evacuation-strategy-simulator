import { describe, expect, it } from "vitest";
import { validateNavigationGraph } from "../../src/core/validateNavigationGraph";
import type { BuildingEnvironment } from "../../src/types/environment";
import type { NavigationGraph } from "../../src/types/navigation";

function createEnvironment(): BuildingEnvironment {
  return {
    layoutId: "test-layout",
    widthMeters: 20,
    heightMeters: 20,
    zones: [
      {
        id: "corridor-a",
        type: "CORRIDOR",
        polygon: {
          vertices: [
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 5 },
            { x: 0, y: 5 },
          ],
        },
      },
    ],
  };
}

function createGraph(): NavigationGraph {
  return {
    layoutId: "test-layout",
    nodes: [
      {
        id: "node-a",
        type: "JUNCTION",
        position: { x: 2, y: 2 },
        zoneId: "corridor-a",
      },
      {
        id: "node-b",
        type: "DECISION_POINT",
        position: { x: 10, y: 2 },
        zoneId: "corridor-a",
      },
    ],
    edges: [
      {
        id: "edge-a-b",
        from: "node-a",
        to: "node-b",
        lengthMeters: 8,
        widthMeters: 3,
        zoneId: "corridor-a",
        bidirectional: true,
      },
    ],
  };
}

describe("NavigationGraph validation", () => {
  it("accepts a valid navigation graph", () => {
    expect(() =>
      validateNavigationGraph(
        createGraph(),
        createEnvironment(),
      ),
    ).not.toThrow();
  });

  it("rejects a graph for the wrong building layout", () => {
    const graph = createGraph();

    expect(() =>
      validateNavigationGraph(
        {
          ...graph,
          layoutId: "wrong-layout",
        },
        createEnvironment(),
      ),
    ).toThrow(/must match/);
  });

  it("rejects duplicate navigation node ids", () => {
    const graph = createGraph();

    const invalid: NavigationGraph = {
      ...graph,
      nodes: [
        ...graph.nodes,
        graph.nodes[0]!,
      ],
    };

    expect(() =>
      validateNavigationGraph(
        invalid,
        createEnvironment(),
      ),
    ).toThrow(/Duplicate navigation node id/);
  });

  it("rejects navigation nodes outside the building bounds", () => {
    const graph = createGraph();

    const invalid: NavigationGraph = {
      ...graph,
      nodes: [
        {
          ...graph.nodes[0]!,
          position: { x: 25, y: 2 },
        },
        graph.nodes[1]!,
      ],
    };

    expect(() =>
      validateNavigationGraph(
        invalid,
        createEnvironment(),
      ),
    ).toThrow(/outside the building bounds/);
  });

  it("rejects edges that reference nonexistent nodes", () => {
    const graph = createGraph();

    const invalid: NavigationGraph = {
      ...graph,
      edges: [
        {
          ...graph.edges[0]!,
          to: "missing-node",
        },
      ],
    };

    expect(() =>
      validateNavigationGraph(
        invalid,
        createEnvironment(),
      ),
    ).toThrow(/missing node/);
  });

  it("rejects invalid edge geometry", () => {
    const graph = createGraph();

    expect(() =>
      validateNavigationGraph(
        {
          ...graph,
          edges: [
            {
              ...graph.edges[0]!,
              widthMeters: 0,
            },
          ],
        },
        createEnvironment(),
      ),
    ).toThrow(/positive finite width/);

    expect(() =>
      validateNavigationGraph(
        {
          ...graph,
          edges: [
            {
              ...graph.edges[0]!,
              lengthMeters: -1,
            },
          ],
        },
        createEnvironment(),
      ),
    ).toThrow(/positive finite length/);
  });
});