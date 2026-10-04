import type {
  AgentState,
} from "../types/agent";

import type {
  DensityCell,
  DensityPartitionMode,
  DensitySnapshot,
} from "../types/density";

import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
} from "../types/navigation";

/**
 * Research Model v1.0 was calibrated using the original
 * trailing-cell discretization.
 *
 * Architecture V2 uses balanced density cells so arbitrary
 * geometric edge lengths cannot create pathological sliver
 * cells near edge endpoints.
 */
export const ARCHITECTURE_V2_LAYOUT_ID =
  "layout-a-architecture-v2";

export function resolveDensityPartitionMode(
  graph:
    NavigationGraph,
): DensityPartitionMode {
  if (
    graph.layoutId ===
    ARCHITECTURE_V2_LAYOUT_ID
  ) {
    return "BALANCED";
  }

  return "LEGACY";
}

function getNode(
  graph:
    NavigationGraph,
  nodeId:
    string,
): NavigationNode {
  const node =
    graph.nodes.find(
      (
        candidate,
      ) =>
        candidate.id ===
        nodeId,
    );

  if (!node) {
    throw new Error(
      `Navigation node not found: ${nodeId}`,
    );
  }

  return node;
}

function calculateProjectedDistance(
  agent:
    AgentState,
  edge:
    NavigationEdge,
  graph:
    NavigationGraph,
): number {
  const fromNode =
    getNode(
      graph,
      edge.from,
    );

  const toNode =
    getNode(
      graph,
      edge.to,
    );

  const edgeDx =
    toNode.position.x -
    fromNode.position.x;

  const edgeDy =
    toNode.position.y -
    fromNode.position.y;

  const geometricLength =
    Math.hypot(
      edgeDx,
      edgeDy,
    );

  if (
    geometricLength <=
    0
  ) {
    throw new Error(
      `Navigation edge ${edge.id} has zero geometric length.`,
    );
  }

  const relativeX =
    agent.position.x -
    fromNode.position.x;

  const relativeY =
    agent.position.y -
    fromNode.position.y;

  const unitX =
    edgeDx /
    geometricLength;

  const unitY =
    edgeDy /
    geometricLength;

  const projectedDistance =
    relativeX *
      unitX +
    relativeY *
      unitY;

  return Math.min(
    edge.lengthMeters,
    Math.max(
      0,
      projectedDistance,
    ),
  );
}

function createLegacyCells(
  edge:
    NavigationEdge,
  cellLengthMeters:
    number,
  counts:
    readonly number[],
): DensityCell[] {
  const cells:
    DensityCell[] =
  [];

  for (
    let cellIndex =
      0;
    cellIndex <
      counts.length;
    cellIndex +=
      1
  ) {
    const startDistanceMeters =
      cellIndex *
      cellLengthMeters;

    const remainingLength =
      edge.lengthMeters -
      startDistanceMeters;

    const actualLength =
      Math.min(
        cellLengthMeters,
        remainingLength,
      );

    const occupantCount =
      counts[
        cellIndex
      ] ??
      0;

    const areaSquareMeters =
      actualLength *
      edge.widthMeters;

    cells.push({
      edgeId:
        edge.id,

      cellIndex,

      startDistanceMeters,

      lengthMeters:
        actualLength,

      widthMeters:
        edge.widthMeters,

      occupantCount,

      densityPersonsPerSquareMeter:
        occupantCount /
        areaSquareMeters,
    });
  }

  return cells;
}

function createBalancedCells(
  edge:
    NavigationEdge,
  counts:
    readonly number[],
): DensityCell[] {
  const cells:
    DensityCell[] =
  [];

  const numberOfCells =
    counts.length;

  const balancedLength =
    edge.lengthMeters /
    numberOfCells;

  for (
    let cellIndex =
      0;
    cellIndex <
      numberOfCells;
    cellIndex +=
      1
  ) {
    const startDistanceMeters =
      cellIndex *
      balancedLength;

    /**
     * Use the remaining geometric distance for the last
     * cell so floating-point accumulation cannot leave
     * a tiny unrepresented remainder.
     */
    const actualLength =
      cellIndex ===
      numberOfCells -
        1
        ? edge.lengthMeters -
          startDistanceMeters
        : balancedLength;

    const occupantCount =
      counts[
        cellIndex
      ] ??
      0;

    const areaSquareMeters =
      actualLength *
      edge.widthMeters;

    cells.push({
      edgeId:
        edge.id,

      cellIndex,

      startDistanceMeters,

      lengthMeters:
        actualLength,

      widthMeters:
        edge.widthMeters,

      occupantCount,

      densityPersonsPerSquareMeter:
        occupantCount /
        areaSquareMeters,
    });
  }

  return cells;
}

function calculateCellIndex(
  projectedDistanceMeters:
    number,
  edge:
    NavigationEdge,
  numberOfCells:
    number,
  nominalCellLengthMeters:
    number,
  partitionMode:
    DensityPartitionMode,
): number {
  let cellIndex:
    number;

  if (
    partitionMode ===
    "BALANCED"
  ) {
    const balancedLength =
      edge.lengthMeters /
      numberOfCells;

    cellIndex =
      Math.floor(
        projectedDistanceMeters /
        balancedLength,
      );
  } else {
    cellIndex =
      Math.floor(
        projectedDistanceMeters /
        nominalCellLengthMeters,
      );
  }

  if (
    cellIndex >=
    numberOfCells
  ) {
    return (
      numberOfCells -
      1
    );
  }

  if (
    cellIndex <
    0
  ) {
    return 0;
  }

  return cellIndex;
}

/**
 * Calculates network-cell pedestrian density.
 *
 * Density:
 *
 * rho = N / (L * W)
 *
 * where:
 *
 * N = number of ACTIVE agents occupying the cell
 * L = actual physical cell length
 * W = usable navigation-edge width
 *
 * LEGACY:
 * preserves the original Research Model v1.0
 * discretization exactly.
 *
 * BALANCED:
 * divides each edge into
 * ceil(edgeLength / nominalCellLength)
 * equal-length cells.
 *
 * Agents not currently traversing an edge are not included
 * in edge-cell density.
 */
export function calculateDensitySnapshot(
  agents:
    readonly AgentState[],
  graph:
    NavigationGraph,
  cellLengthMeters =
    1,
): DensitySnapshot {
  if (
    !Number.isFinite(
      cellLengthMeters,
    ) ||
    cellLengthMeters <=
      0
  ) {
    throw new Error(
      "Density cell length must be positive and finite.",
    );
  }

  const partitionMode =
    resolveDensityPartitionMode(
      graph,
    );

  const cells:
    DensityCell[] =
  [];

  for (
    const edge of
      graph.edges
  ) {
    if (
      !Number.isFinite(
        edge.lengthMeters,
      ) ||
      edge.lengthMeters <=
        0
    ) {
      throw new Error(
        `Navigation edge ${edge.id} must have positive finite length.`,
      );
    }

    if (
      !Number.isFinite(
        edge.widthMeters,
      ) ||
      edge.widthMeters <=
        0
    ) {
      throw new Error(
        `Navigation edge ${edge.id} must have positive finite width.`,
      );
    }

    const numberOfCells =
      Math.ceil(
        edge.lengthMeters /
        cellLengthMeters,
      );

    const counts =
      new Array<number>(
        numberOfCells,
      ).fill(
        0,
      );

    const agentsOnEdge =
      agents.filter(
        (
          agent,
        ) =>
          agent.status ===
            "ACTIVE" &&
          agent.currentEdgeId ===
            edge.id,
      );

    for (
      const agent of
        agentsOnEdge
    ) {
      const projectedDistance =
        calculateProjectedDistance(
          agent,
          edge,
          graph,
        );

      const cellIndex =
        calculateCellIndex(
          projectedDistance,
          edge,
          numberOfCells,
          cellLengthMeters,
          partitionMode,
        );

      counts[
        cellIndex
      ] =
        (
          counts[
            cellIndex
          ] ??
          0
        ) +
        1;
    }

    if (
      partitionMode ===
      "BALANCED"
    ) {
      cells.push(
        ...createBalancedCells(
          edge,
          counts,
        ),
      );
    } else {
      cells.push(
        ...createLegacyCells(
          edge,
          cellLengthMeters,
          counts,
        ),
      );
    }
  }

  /**
   * Preserve the original snapshot shape for LEGACY runs.
   *
   * This minimizes regression risk for the already-frozen
   * Research Model v1.0.
   */
  if (
    partitionMode ===
    "LEGACY"
  ) {
    return {
      cellLengthMeters,

      cells,
    };
  }

  return {
    cellLengthMeters,

    partitionMode:
      "BALANCED",

    cells,
  };
}