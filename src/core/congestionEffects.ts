import type { AgentState } from "../types/agent";
import type { DensitySnapshot } from "../types/density";
import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
} from "../types/navigation";

/**
 * Baseline values used by the selected Weidmann
 * pedestrian speed-density relationship.
 */
export const WEIDMANN_FREE_FLOW_SPEED_MPS = 1.34;
export const WEIDMANN_LAMBDA = 1.913;
export const WEIDMANN_JAM_DENSITY_PPM2 = 5.4;

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

function getEdge(
  graph: NavigationGraph,
  edgeId: string,
): NavigationEdge {
  const edge = graph.edges.find(
    (candidate) => candidate.id === edgeId,
  );

  if (!edge) {
    throw new Error(
      `Navigation edge not found: ${edgeId}`,
    );
  }

  return edge;
}

function projectedDistanceFromEdgeStart(
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

  const dx =
    toNode.position.x -
    fromNode.position.x;

  const dy =
    toNode.position.y -
    fromNode.position.y;

  const geometricLength =
    Math.hypot(dx, dy);

  if (geometricLength <= 0) {
    throw new Error(
      `Navigation edge ${edge.id} has zero geometric length.`,
    );
  }

  const unitX =
    dx / geometricLength;

  const unitY =
    dy / geometricLength;

  const relativeX =
    agent.position.x -
    fromNode.position.x;

  const relativeY =
    agent.position.y -
    fromNode.position.y;

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
 * Returns the baseline pedestrian speed predicted by the
 * Weidmann speed-density relationship.
 */
export function calculateWeidmannSpeedMps(
  densityPersonsPerSquareMeter: number,
): number {
  if (
    !Number.isFinite(
      densityPersonsPerSquareMeter,
    ) ||
    densityPersonsPerSquareMeter < 0
  ) {
    throw new Error(
      "Pedestrian density must be non-negative and finite.",
    );
  }

  if (
    densityPersonsPerSquareMeter === 0
  ) {
    return WEIDMANN_FREE_FLOW_SPEED_MPS;
  }

  if (
    densityPersonsPerSquareMeter >=
    WEIDMANN_JAM_DENSITY_PPM2
  ) {
    return 0;
  }

  const exponent =
    -WEIDMANN_LAMBDA *
    (
      1 /
        densityPersonsPerSquareMeter -
      1 /
        WEIDMANN_JAM_DENSITY_PPM2
    );

  const speed =
    WEIDMANN_FREE_FLOW_SPEED_MPS *
    (
      1 -
      Math.exp(exponent)
    );

  return Math.max(
    0,
    Math.min(
      WEIDMANN_FREE_FLOW_SPEED_MPS,
      speed,
    ),
  );
}

/**
 * Converts density into a normalized speed factor.
 *
 * 1 = unrestricted free-flow movement
 * 0 = jammed movement
 */
export function calculateCongestionSpeedFactor(
  densityPersonsPerSquareMeter: number,
): number {
  const baselineSpeed =
    calculateWeidmannSpeedMps(
      densityPersonsPerSquareMeter,
    );

  return (
    baselineSpeed /
    WEIDMANN_FREE_FLOW_SPEED_MPS
  );
}

/**
 * Finds the density cell currently occupied by an agent.
 *
 * Agents that are not traversing an edge have no edge-cell
 * density and return zero.
 */
export function getAgentLocalDensity(
  agent: AgentState,
  graph: NavigationGraph,
  snapshot: DensitySnapshot,
): number {
  if (
    agent.currentEdgeId === null ||
    agent.status !== "ACTIVE"
  ) {
    return 0;
  }

  const edge = getEdge(
    graph,
    agent.currentEdgeId,
  );

  const projectedDistance =
    projectedDistanceFromEdgeStart(
      agent,
      edge,
      graph,
    );

  let cellIndex =
    Math.floor(
      projectedDistance /
        snapshot.cellLengthMeters,
    );

  const edgeCells =
    snapshot.cells.filter(
      (cell) =>
        cell.edgeId === edge.id,
    );

  if (edgeCells.length === 0) {
    throw new Error(
      `Density snapshot contains no cells for edge ${edge.id}.`,
    );
  }

  if (
    cellIndex >= edgeCells.length
  ) {
    cellIndex =
      edgeCells.length - 1;
  }

  const cell =
    edgeCells.find(
      (candidate) =>
        candidate.cellIndex ===
        cellIndex,
    );

  if (!cell) {
    throw new Error(
      `Density cell not found for edge ${edge.id}, cell ${cellIndex}.`,
    );
  }

  return (
    cell.densityPersonsPerSquareMeter
  );
}

/**
 * Calculates an individual agent's congestion-adjusted
 * walking speed.
 *
 * Each agent retains its own desired free-flow speed.
 * Density modifies that speed through the normalized
 * Weidmann relationship.
 */
export function calculateAgentEffectiveSpeedMps(
  agent: AgentState,
  graph: NavigationGraph,
  snapshot: DensitySnapshot,
): number {
  if (
    !Number.isFinite(
      agent.desiredSpeedMps,
    ) ||
    agent.desiredSpeedMps <= 0
  ) {
    throw new Error(
      `Agent ${agent.id} must have a positive finite desired speed.`,
    );
  }

  const localDensity =
    getAgentLocalDensity(
      agent,
      graph,
      snapshot,
    );

  const factor =
    calculateCongestionSpeedFactor(
      localDensity,
    );

  return (
    agent.desiredSpeedMps *
    factor
  );
}