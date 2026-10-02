import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNodeId,
} from "../types/navigation";

import type {
  DijkstraOptions,
  RoutingPath,
  RoutingTraversal,
} from "../types/routing";

interface QueueItem {
  readonly nodeId: NavigationNodeId;
  readonly cost: number;
}

interface Predecessor {
  readonly previousNodeId: NavigationNodeId;
  readonly edgeId: string;
}

class MinPriorityQueue {
  private readonly items: QueueItem[] = [];

  public get size(): number {
    return this.items.length;
  }

  private comesBefore(
    first: QueueItem,
    second: QueueItem,
  ): boolean {
    const tolerance = 1e-12;

    if (
      first.cost <
      second.cost - tolerance
    ) {
      return true;
    }

    if (
      Math.abs(
        first.cost -
          second.cost,
      ) <= tolerance
    ) {
      return (
        first.nodeId <
        second.nodeId
      );
    }

    return false;
  }

  public push(
    item: QueueItem,
  ): void {
    this.items.push(item);

    let index =
      this.items.length - 1;

    while (index > 0) {
      const parentIndex =
        Math.floor(
          (index - 1) / 2,
        );

      const current =
        this.items[index]!;

      const parent =
        this.items[parentIndex]!;

      if (
        !this.comesBefore(
          current,
          parent,
        )
      ) {
        break;
      }

      this.items[index] =
        parent;

      this.items[parentIndex] =
        current;

      index =
        parentIndex;
    }
  }

  public pop():
    QueueItem | null {
    if (
      this.items.length === 0
    ) {
      return null;
    }

    const minimum =
      this.items[0]!;

    const last =
      this.items.pop()!;

    if (
      this.items.length === 0
    ) {
      return minimum;
    }

    this.items[0] = last;

    let index = 0;

    while (true) {
      const leftIndex =
        index * 2 + 1;

      const rightIndex =
        index * 2 + 2;

      let smallestIndex =
        index;

      if (
        leftIndex <
          this.items.length &&
        this.comesBefore(
          this.items[leftIndex]!,
          this.items[smallestIndex]!,
        )
      ) {
        smallestIndex =
          leftIndex;
      }

      if (
        rightIndex <
          this.items.length &&
        this.comesBefore(
          this.items[rightIndex]!,
          this.items[smallestIndex]!,
        )
      ) {
        smallestIndex =
          rightIndex;
      }

      if (
        smallestIndex ===
        index
      ) {
        break;
      }

      const current =
        this.items[index]!;

      this.items[index] =
        this.items[
          smallestIndex
        ]!;

      this.items[
        smallestIndex
      ] = current;

      index =
        smallestIndex;
    }

    return minimum;
  }
}

function buildTraversals(
  graph: NavigationGraph,
): Map<
  NavigationNodeId,
  RoutingTraversal[]
> {
  const adjacency =
    new Map<
      NavigationNodeId,
      RoutingTraversal[]
    >();

  for (
    const node of graph.nodes
  ) {
    if (
      adjacency.has(node.id)
    ) {
      throw new Error(
        `Duplicate navigation node id: ${node.id}`,
      );
    }

    adjacency.set(
      node.id,
      [],
    );
  }

  const edgeIds =
    new Set<string>();

  for (
    const edge of graph.edges
  ) {
    if (
      edgeIds.has(edge.id)
    ) {
      throw new Error(
        `Duplicate navigation edge id: ${edge.id}`,
      );
    }

    edgeIds.add(edge.id);

    if (
      !adjacency.has(
        edge.from,
      )
    ) {
      throw new Error(
        `Navigation edge ${edge.id} references missing node ${edge.from}.`,
      );
    }

    if (
      !adjacency.has(
        edge.to,
      )
    ) {
      throw new Error(
        `Navigation edge ${edge.id} references missing node ${edge.to}.`,
      );
    }

    adjacency
      .get(edge.from)!
      .push({
        edge,
        fromNodeId:
          edge.from,
        toNodeId:
          edge.to,
      });

    if (
      edge.bidirectional
    ) {
      adjacency
        .get(edge.to)!
        .push({
          edge,
          fromNodeId:
            edge.to,
          toNodeId:
            edge.from,
        });
    }
  }

  /**
   * Deterministic ordering ensures equal-cost route selection
   * does not depend on the original edge-array order.
   */
  for (
    const traversals of
      adjacency.values()
  ) {
    traversals.sort(
      (first, second) => {
        const nodeComparison =
          first.toNodeId.localeCompare(
            second.toNodeId,
          );

        if (
          nodeComparison !== 0
        ) {
          return nodeComparison;
        }

        return first.edge.id.localeCompare(
          second.edge.id,
        );
      },
    );
  }

  return adjacency;
}

function validateTargets(
  graph: NavigationGraph,
  targetNodeIds:
    readonly NavigationNodeId[],
): Set<NavigationNodeId> {
  if (
    targetNodeIds.length === 0
  ) {
    throw new Error(
      "Dijkstra routing requires at least one target node.",
    );
  }

  const graphNodeIds =
    new Set(
      graph.nodes.map(
        (node) => node.id,
      ),
    );

  const targets =
    new Set<NavigationNodeId>();

  for (
    const targetNodeId of
      targetNodeIds
  ) {
    if (
      !graphNodeIds.has(
        targetNodeId,
      )
    ) {
      throw new Error(
        `Target navigation node not found: ${targetNodeId}`,
      );
    }

    targets.add(
      targetNodeId,
    );
  }

  return targets;
}

function calculateTraversalCost(
  traversal: RoutingTraversal,
  options: DijkstraOptions,
): number {
  const cost =
    options.edgeCost
      ? options.edgeCost(
          traversal,
        )
      : traversal.edge
          .lengthMeters;

  if (
    !Number.isFinite(cost) ||
    cost < 0
  ) {
    throw new Error(
      `Routing cost for edge ${traversal.edge.id} must be non-negative and finite.`,
    );
  }

  return cost;
}

function reconstructPath(
  startNodeId:
    NavigationNodeId,
  targetNodeId:
    NavigationNodeId,
  totalCost: number,
  predecessorByNode:
    ReadonlyMap<
      NavigationNodeId,
      Predecessor
    >,
): RoutingPath {
  const reversedNodeIds:
    NavigationNodeId[] = [
      targetNodeId,
    ];

  const reversedEdgeIds:
    string[] = [];

  let currentNodeId =
    targetNodeId;

  while (
    currentNodeId !==
    startNodeId
  ) {
    const predecessor =
      predecessorByNode.get(
        currentNodeId,
      );

    if (!predecessor) {
      throw new Error(
        `Unable to reconstruct route to ${targetNodeId}.`,
      );
    }

    reversedEdgeIds.push(
      predecessor.edgeId,
    );

    currentNodeId =
      predecessor.previousNodeId;

    reversedNodeIds.push(
      currentNodeId,
    );
  }

  return {
    nodeIds:
      reversedNodeIds.reverse(),

    edgeIds:
      reversedEdgeIds.reverse(),

    totalCost,

    targetNodeId,
  };
}

/**
 * Finds the minimum-cost route from one start node to the
 * cheapest reachable target using Dijkstra's algorithm.
 *
 * The solver is deliberately strategy-independent.
 *
 * Different routing policies can provide:
 *
 * - different traversal costs
 * - different traversal-availability rules
 *
 * without modifying the graph or Dijkstra implementation.
 */
export function findShortestPathDijkstra(
  graph: NavigationGraph,
  startNodeId:
    NavigationNodeId,
  targetNodeIds:
    readonly NavigationNodeId[],
  options: DijkstraOptions = {},
): RoutingPath | null {
  const adjacency =
    buildTraversals(graph);

  if (
    !adjacency.has(
      startNodeId,
    )
  ) {
    throw new Error(
      `Start navigation node not found: ${startNodeId}`,
    );
  }

  const targets =
    validateTargets(
      graph,
      targetNodeIds,
    );

  if (
    targets.has(
      startNodeId,
    )
  ) {
    return {
      nodeIds: [
        startNodeId,
      ],

      edgeIds: [],

      totalCost: 0,

      targetNodeId:
        startNodeId,
    };
  }

  const distanceByNode =
    new Map<
      NavigationNodeId,
      number
    >();

  const predecessorByNode =
    new Map<
      NavigationNodeId,
      Predecessor
    >();

  const queue =
    new MinPriorityQueue();

  distanceByNode.set(
    startNodeId,
    0,
  );

  queue.push({
    nodeId:
      startNodeId,

    cost: 0,
  });

  const tolerance = 1e-12;

  while (
    queue.size > 0
  ) {
    const current =
      queue.pop()!;

    const bestKnownCost =
      distanceByNode.get(
        current.nodeId,
      );

    if (
      bestKnownCost ===
      undefined
    ) {
      continue;
    }

    /**
     * Ignore stale priority-queue entries.
     */
    if (
      current.cost >
      bestKnownCost +
        tolerance
    ) {
      continue;
    }

    if (
      targets.has(
        current.nodeId,
      )
    ) {
      return reconstructPath(
        startNodeId,
        current.nodeId,
        current.cost,
        predecessorByNode,
      );
    }

    const traversals =
      adjacency.get(
        current.nodeId,
      ) ?? [];

    for (
      const traversal of
        traversals
    ) {
      if (
        options.isTraversalAllowed &&
        !options.isTraversalAllowed(
          traversal,
        )
      ) {
        continue;
      }

      const traversalCost =
        calculateTraversalCost(
          traversal,
          options,
        );

      const candidateCost =
        current.cost +
        traversalCost;

      const existingCost =
        distanceByNode.get(
          traversal.toNodeId,
        );

      if (
        existingCost !==
          undefined &&
        candidateCost >=
          existingCost -
            tolerance
      ) {
        continue;
      }

      distanceByNode.set(
        traversal.toNodeId,
        candidateCost,
      );

      predecessorByNode.set(
        traversal.toNodeId,
        {
          previousNodeId:
            current.nodeId,

          edgeId:
            traversal.edge.id,
        },
      );

      queue.push({
        nodeId:
          traversal.toNodeId,

        cost:
          candidateCost,
      });
    }
  }

  return null;
}