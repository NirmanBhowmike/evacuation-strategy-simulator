import {
  describe,
  expect,
  it,
} from "vitest";

import { findShortestPathDijkstra } from "../../src/core/dijkstra";

import type { NavigationGraph } from "../../src/types/navigation";

function createGraph(): NavigationGraph {
  return {
    layoutId:
      "routing-test",

    nodes: [
      {
        id: "node-a",
        type: "JUNCTION",

        position: {
          x: 0,
          y: 0,
        },

        zoneId:
          "corridor-a",
      },

      {
        id: "node-b",
        type: "JUNCTION",

        position: {
          x: 1,
          y: 1,
        },

        zoneId:
          "corridor-a",
      },

      {
        id: "node-c",
        type: "JUNCTION",

        position: {
          x: 1,
          y: -1,
        },

        zoneId:
          "corridor-b",
      },

      {
        id: "node-d",
        type: "EXIT",

        position: {
          x: 2,
          y: 0,
        },

        zoneId:
          "corridor-d",
      },

      {
        id: "node-e",
        type: "EXIT",

        position: {
          x: 4,
          y: 0,
        },

        zoneId:
          "corridor-e",
      },

      {
        id: "node-isolated",
        type: "JUNCTION",

        position: {
          x: 10,
          y: 10,
        },

        zoneId:
          "corridor-isolated",
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
          2,

        widthMeters:
          3,

        zoneId:
          "corridor-a",

        bidirectional:
          true,
      },

      {
        id:
          "edge-b-d",

        from:
          "node-b",

        to:
          "node-d",

        lengthMeters:
          2,

        widthMeters:
          3,

        zoneId:
          "corridor-a",

        bidirectional:
          true,
      },

      {
        id:
          "edge-a-c",

        from:
          "node-a",

        to:
          "node-c",

        lengthMeters:
          1,

        widthMeters:
          2,

        zoneId:
          "corridor-b",

        bidirectional:
          true,
      },

      {
        id:
          "edge-c-d",

        from:
          "node-c",

        to:
          "node-d",

        lengthMeters:
          1,

        widthMeters:
          2,

        zoneId:
          "corridor-b",

        bidirectional:
          true,
      },

      {
        id:
          "edge-d-e",

        from:
          "node-d",

        to:
          "node-e",

        lengthMeters:
          2,

        widthMeters:
          3,

        zoneId:
          "corridor-d",

        bidirectional:
          false,
      },

      {
        id:
          "edge-a-d-direct",

        from:
          "node-a",

        to:
          "node-d",

        lengthMeters:
          10,

        widthMeters:
          5,

        zoneId:
          "corridor-direct",

        bidirectional:
          true,
      },
    ],
  };
}

describe(
  "Dijkstra routing",
  () => {
    it("finds the minimum-distance route", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-a",
          [
            "node-d",
          ],
        );

      expect(route).not.toBeNull();

      expect(
        route?.nodeIds,
      ).toEqual([
        "node-a",
        "node-c",
        "node-d",
      ]);

      expect(
        route?.edgeIds,
      ).toEqual([
        "edge-a-c",
        "edge-c-d",
      ]);

      expect(
        route?.totalCost,
      ).toBe(2);

      expect(
        route?.targetNodeId,
      ).toBe("node-d");
    });

    it("does not choose a geometrically direct edge when its routing cost is higher", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-a",
          [
            "node-d",
          ],
        );

      expect(
        route?.edgeIds,
      ).not.toContain(
        "edge-a-d-direct",
      );
    });

    it("supports reverse travel on bidirectional edges", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-d",
          [
            "node-a",
          ],
        );

      expect(
        route?.nodeIds,
      ).toEqual([
        "node-d",
        "node-c",
        "node-a",
      ]);

      expect(
        route?.totalCost,
      ).toBe(2);
    });

    it("respects one-way navigation edges", () => {
      const forward =
        findShortestPathDijkstra(
          createGraph(),
          "node-d",
          [
            "node-e",
          ],
        );

      expect(
        forward?.nodeIds,
      ).toEqual([
        "node-d",
        "node-e",
      ]);

      const reverse =
        findShortestPathDijkstra(
          createGraph(),
          "node-e",
          [
            "node-d",
          ],
        );

      expect(reverse).toBeNull();
    });

    it("selects the cheapest reachable target from multiple targets", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-a",
          [
            "node-e",
            "node-d",
          ],
        );

      expect(
        route?.targetNodeId,
      ).toBe("node-d");

      expect(
        route?.totalCost,
      ).toBe(2);
    });

    it("supports strategy-specific edge costs", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-a",
          [
            "node-d",
          ],
          {
            edgeCost:
              ({ edge }) => {
                if (
                  edge.id ===
                    "edge-a-c" ||
                  edge.id ===
                    "edge-c-d"
                ) {
                  return 100;
                }

                return edge.lengthMeters;
              },
          },
        );

      expect(
        route?.nodeIds,
      ).toEqual([
        "node-a",
        "node-b",
        "node-d",
      ]);

      expect(
        route?.totalCost,
      ).toBe(4);
    });

    it("supports strategy-specific traversal exclusions", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-a",
          [
            "node-d",
          ],
          {
            isTraversalAllowed:
              ({ edge }) =>
                edge.zoneId !==
                "corridor-b",
          },
        );

      expect(
        route?.nodeIds,
      ).toEqual([
        "node-a",
        "node-b",
        "node-d",
      ]);

      expect(
        route?.edgeIds,
      ).toEqual([
        "edge-a-b",
        "edge-b-d",
      ]);
    });

    it("returns null when no target can be reached", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-a",
          [
            "node-isolated",
          ],
        );

      expect(route).toBeNull();
    });

    it("returns a zero-cost route when the start is already a target", () => {
      const route =
        findShortestPathDijkstra(
          createGraph(),
          "node-d",
          [
            "node-d",
            "node-e",
          ],
        );

      expect(route).toEqual({
        nodeIds: [
          "node-d",
        ],

        edgeIds: [],

        totalCost: 0,

        targetNodeId:
          "node-d",
      });
    });

    it("rejects invalid routing inputs and invalid edge costs", () => {
      const graph =
        createGraph();

      expect(() =>
        findShortestPathDijkstra(
          graph,
          "missing-node",
          [
            "node-d",
          ],
        ),
      ).toThrow(
        /Start navigation node not found/,
      );

      expect(() =>
        findShortestPathDijkstra(
          graph,
          "node-a",
          [],
        ),
      ).toThrow(
        /at least one target/,
      );

      expect(() =>
        findShortestPathDijkstra(
          graph,
          "node-a",
          [
            "missing-target",
          ],
        ),
      ).toThrow(
        /Target navigation node not found/,
      );

      expect(() =>
        findShortestPathDijkstra(
          graph,
          "node-a",
          [
            "node-d",
          ],
          {
            edgeCost:
              () => -1,
          },
        ),
      ).toThrow(
        /cost.*non-negative and finite/,
      );
    });
  },
);