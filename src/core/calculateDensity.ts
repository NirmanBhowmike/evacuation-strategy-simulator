import type { AgentState } from "../types/agent";
import type {
  DensityCell,
  DensitySnapshot,
} from "../types/density";
import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
} from "../types/navigation";

function getNode(
  graph: NavigationGraph,
  nodeId: string,
): NavigationNode {
  const node = graph.nodes.find(
    (candidate) => candidate.id === nodeId,
  );

  if (!node) {
    throw new Error(
      `Navigation node not found: ${nodeId}`,
    );
  }

  return node;
}

function calculateProjectedDistance(
  agent: AgentState,
  edge: NavigationEdge,
  graph: NavigationGraph,
): number {
  const fromNode = getNode(
    graph,
    edge.from,
  );

  const toNode = getNode(
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

  if (geometricLength <= 0) {
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
    relativeX * unitX +
    relativeY * unitY;

  return Math.min(
    edge.lengthMeters,
    Math.max(
      0,
      projectedDistance,
    ),
  );
}

/**
 * Calculates network-cell pedestrian density.
 *
 * Density:
 *
 * rho = N / (L * W)
 *
 * where:
 * N = number of ACTIVE agents occupying the cell
 * L = actual cell length
 * W = navigation-edge width
 *
 * Agents not currently traversing an edge are not included in
 * edge-cell density.
 */
export function calculateDensitySnapshot(
  agents: readonly AgentState[],
  graph: NavigationGraph,
  cellLengthMeters = 1,
): DensitySnapshot {
  if (
    !Number.isFinite(
      cellLengthMeters,
    ) ||
    cellLengthMeters <= 0
  ) {
    throw new Error(
      "Density cell length must be positive and finite.",
    );
  }

  const cells: DensityCell[] = [];

  for (const edge of graph.edges) {
    if (
      !Number.isFinite(
        edge.lengthMeters,
      ) ||
      edge.lengthMeters <= 0
    ) {
      throw new Error(
        `Navigation edge ${edge.id} must have positive finite length.`,
      );
    }

    if (
      !Number.isFinite(
        edge.widthMeters,
      ) ||
      edge.widthMeters <= 0
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

    const counts = new Array<number>(
      numberOfCells,
    ).fill(0);

    const agentsOnEdge =
      agents.filter(
        (agent) =>
          agent.status === "ACTIVE" &&
          agent.currentEdgeId ===
            edge.id,
      );

    for (const agent of agentsOnEdge) {
      const projectedDistance =
        calculateProjectedDistance(
          agent,
          edge,
          graph,
        );

      let cellIndex =
        Math.floor(
          projectedDistance /
            cellLengthMeters,
        );

      if (
        cellIndex >= numberOfCells
      ) {
        cellIndex =
          numberOfCells - 1;
      }

      counts[cellIndex] =
        (counts[cellIndex] ?? 0) +
        1;
    }

    for (
      let cellIndex = 0;
      cellIndex < numberOfCells;
      cellIndex += 1
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
        counts[cellIndex] ?? 0;

      const areaSquareMeters =
        actualLength *
        edge.widthMeters;

      const density =
        occupantCount /
        areaSquareMeters;

      cells.push({
        edgeId: edge.id,
        cellIndex,
        startDistanceMeters,
        lengthMeters:
          actualLength,
        widthMeters:
          edge.widthMeters,
        occupantCount,
        densityPersonsPerSquareMeter:
          density,
      });
    }
  }

  return {
    cellLengthMeters,
    cells,
  };
}