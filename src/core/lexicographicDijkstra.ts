import type {
  NavigationGraph,
  NavigationNodeId,
} from "../types/navigation";

import type {
  RoutingPath,
  RoutingTraversal,
} from "../types/routing";

export interface LexicographicTraversalCost {
  readonly primaryCost: number;
  readonly secondaryCost: number;
}

export interface LexicographicRoutingPath
  extends RoutingPath {
  readonly primaryCost: number;
  readonly secondaryCost: number;
}

export interface LexicographicDijkstraOptions {
  readonly traversalCost: (
    traversal: RoutingTraversal,
  ) => LexicographicTraversalCost;

  readonly isTraversalAllowed?: (
    traversal: RoutingTraversal,
  ) => boolean;
}

interface Label {
  readonly primaryCost: number;
  readonly secondaryCost: number;
}

interface QueueItem extends Label {
  readonly nodeId: NavigationNodeId;
}

interface Predecessor {
  readonly previousNodeId: NavigationNodeId;
  readonly edgeId: string;
}

function compareLabels(
  first: Label,
  second: Label,
): number {
  const tolerance = 1e-12;

  if (
    first.primaryCost <
    second.primaryCost - tolerance
  ) {
    return -1;
  }

  if (
    first.primaryCost >
    second.primaryCost + tolerance
  ) {
    return 1;
  }

  if (
    first.secondaryCost <
    second.secondaryCost - tolerance
  ) {
    return -1;
  }

  if (
    first.secondaryCost >
    second.secondaryCost + tolerance
  ) {
    return 1;
  }

  return 0;
}

class LexicographicPriorityQueue {
  private readonly items: QueueItem[] =
    [];

  public get size(): number {
    return this.items.length;
  }

  private comesBefore(
    first: QueueItem,
    second: QueueItem,
  ): boolean {
    const comparison =
      compareLabels(
        first,
        second,
      );

    if (comparison !== 0) {
      return comparison < 0;
    }

    return (
      first.nodeId <
      second.nodeId
    );
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
          this.items[
            smallestIndex
          ]!,
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
          this.items[
            smallestIndex
          ]!,
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

function buildAdjacency(
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

  for (const node of graph.nodes) {
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

  for (const edge of graph.edges) {
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
      ) ||
      !adjacency.has(
        edge.to,
      )
    ) {
      throw new Error(
        `Navigation edge ${edge.id} references a missing node.`,
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

    if (edge.bidirectional) {
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

function reconstructPath(
  startNodeId:
    NavigationNodeId,
  targetNodeId:
    NavigationNodeId,
  label: Label,
  predecessors:
    ReadonlyMap<
      NavigationNodeId,
      Predecessor
    >,
): LexicographicRoutingPath {
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
      predecessors.get(
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

    primaryCost:
      label.primaryCost,

    secondaryCost:
      label.secondaryCost,

    /**
     * RoutingPath requires one totalCost value.
     *
     * For lexicographic routing, secondaryCost is the physical
     * travel-time cost. The primary safety cost is retained
     * separately rather than combined with an arbitrary weight.
     */
    totalCost:
      label.secondaryCost,

    targetNodeId,
  };
}

export function findLexicographicShortestPath(
  graph: NavigationGraph,
  startNodeId:
    NavigationNodeId,
  targetNodeIds:
    readonly NavigationNodeId[],
  options:
    LexicographicDijkstraOptions,
): LexicographicRoutingPath | null {
  const adjacency =
    buildAdjacency(graph);

  if (
    !adjacency.has(
      startNodeId,
    )
  ) {
    throw new Error(
      `Start navigation node not found: ${startNodeId}`,
    );
  }

  if (
    targetNodeIds.length === 0
  ) {
    throw new Error(
      "Lexicographic routing requires at least one target node.",
    );
  }

  const targets =
    new Set<
      NavigationNodeId
    >();

  for (
    const targetNodeId of
      targetNodeIds
  ) {
    if (
      !adjacency.has(
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

      primaryCost: 0,

      secondaryCost: 0,

      totalCost: 0,

      targetNodeId:
        startNodeId,
    };
  }

  const labels =
    new Map<
      NavigationNodeId,
      Label
    >();

  const predecessors =
    new Map<
      NavigationNodeId,
      Predecessor
    >();

  const queue =
    new LexicographicPriorityQueue();

  const startLabel: Label = {
    primaryCost: 0,
    secondaryCost: 0,
  };

  labels.set(
    startNodeId,
    startLabel,
  );

  queue.push({
    nodeId:
      startNodeId,

    ...startLabel,
  });

  while (
    queue.size > 0
  ) {
    const current =
      queue.pop()!;

    const bestKnown =
      labels.get(
        current.nodeId,
      );

    if (!bestKnown) {
      continue;
    }

    if (
      compareLabels(
        current,
        bestKnown,
      ) > 0
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
        bestKnown,
        predecessors,
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
        options.traversalCost(
          traversal,
        );

      if (
        !Number.isFinite(
          traversalCost.primaryCost,
        ) ||
        traversalCost.primaryCost < 0
      ) {
        throw new Error(
          `Primary routing cost for edge ${traversal.edge.id} must be non-negative and finite.`,
        );
      }

      if (
        !Number.isFinite(
          traversalCost.secondaryCost,
        ) ||
        traversalCost.secondaryCost < 0
      ) {
        throw new Error(
          `Secondary routing cost for edge ${traversal.edge.id} must be non-negative and finite.`,
        );
      }

      const candidate: Label = {
        primaryCost:
          bestKnown.primaryCost +
          traversalCost.primaryCost,

        secondaryCost:
          bestKnown.secondaryCost +
          traversalCost.secondaryCost,
      };

      const existing =
        labels.get(
          traversal.toNodeId,
        );

      if (
        existing &&
        compareLabels(
          candidate,
          existing,
        ) >= 0
      ) {
        continue;
      }

      labels.set(
        traversal.toNodeId,
        candidate,
      );

      predecessors.set(
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

        ...candidate,
      });
    }
  }

  return null;
}