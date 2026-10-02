import { describe, expect, it } from "vitest";

import { validateNavigationGraph } from "../../src/core/validateNavigationGraph";

import { layoutA } from "../../src/environment/layoutA";
import { layoutAExits } from "../../src/environment/layoutAExits";
import { layoutANavigationGraph } from "../../src/environment/layoutANavigationGraph";

import type { NavigationGraph } from "../../src/types/navigation";

function getReachableNodes(
  graph: NavigationGraph,
  startId: string,
): Set<string> {
  const adjacency = new Map<string, string[]>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of graph.edges) {
    adjacency.get(edge.from)?.push(edge.to);

    if (edge.bidirectional) {
      adjacency.get(edge.to)?.push(edge.from);
    }
  }

  const visited = new Set<string>();
  const queue: string[] = [startId];

  visited.add(startId);

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited;
}

describe("Layout A navigation graph", () => {
  it("passes navigation-graph validation", () => {
    expect(() =>
      validateNavigationGraph(
        layoutANavigationGraph,
        layoutA,
      ),
    ).not.toThrow();
  });

  it("belongs to Layout A", () => {
    expect(
      layoutANavigationGraph.layoutId,
    ).toBe("layout-a");
  });

  it("contains exactly one navigation node for each primary exit", () => {
    const exitNodes =
      layoutANavigationGraph.nodes.filter(
        (node) => node.type === "EXIT",
      );

    expect(exitNodes).toHaveLength(
      layoutAExits.exits.length,
    );

    for (const exit of layoutAExits.exits) {
      const node =
        layoutANavigationGraph.nodes.find(
          (candidate) =>
            candidate.id === exit.id,
        );

      expect(node).toBeDefined();
      expect(node?.type).toBe("EXIT");
      expect(node?.position).toEqual(
        exit.position,
      );
      expect(node?.zoneId).toBe(
        exit.connectedZoneId,
      );
    }
  });

  it("forms one connected navigation network", () => {
    const startNode =
      layoutANavigationGraph.nodes[0];

    expect(startNode).toBeDefined();

    const reachable = getReachableNodes(
      layoutANavigationGraph,
      startNode!.id,
    );

    expect(reachable.size).toBe(
      layoutANavigationGraph.nodes.length,
    );
  });

  it("contains a narrow bottleneck route", () => {
    const bottleneck =
      layoutANavigationGraph.edges.find(
        (edge) =>
          edge.id === "edge-bottleneck-core",
      );

    expect(bottleneck).toBeDefined();
    expect(bottleneck?.widthMeters).toBe(2);
  });

  it("keeps the upper alternative wider than the bottleneck", () => {
    const bottleneck =
      layoutANavigationGraph.edges.find(
        (edge) =>
          edge.id === "edge-bottleneck-core",
      );

    const upper =
      layoutANavigationGraph.edges.find(
        (edge) =>
          edge.id ===
          "edge-upper-west-upper-east",
      );

    expect(bottleneck).toBeDefined();
    expect(upper).toBeDefined();

    expect(
      upper!.widthMeters,
    ).toBeGreaterThan(
      bottleneck!.widthMeters,
    );
  });

  it("contains the main, bottleneck, and upper route alternatives", () => {
    const edgeIds = new Set(
      layoutANavigationGraph.edges.map(
        (edge) => edge.id,
      ),
    );

    expect(
      edgeIds.has(
        "edge-main-central-main-mid",
      ),
    ).toBe(true);

    expect(
      edgeIds.has(
        "edge-bottleneck-core",
      ),
    ).toBe(true);

    expect(
      edgeIds.has(
        "edge-upper-west-upper-east",
      ),
    ).toBe(true);
  });
});