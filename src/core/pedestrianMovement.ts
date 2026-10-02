import type { AgentState } from "../types/agent";
import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
  NavigationNodeId,
} from "../types/navigation";

export interface MovementStepResult {
  readonly distanceMovedMeters: number;
  readonly arrivedAtNodeId: NavigationNodeId | null;

  /**
   * Distance that could have been traveled during this timestep
   * after reaching the destination node.
   *
   * A later simulation-loop layer may use this remaining movement
   * budget to continue onto another edge during the same timestep.
   */
  readonly unusedDistanceMeters: number;
}

function getNode(
  graph: NavigationGraph,
  nodeId: NavigationNodeId,
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

function getDestinationNode(
  agent: AgentState,
  edge: NavigationEdge,
  graph: NavigationGraph,
): NavigationNode {
  if (agent.currentNodeId === null) {
    throw new Error(
      `Agent ${agent.id} must have a current node before entering an edge.`,
    );
  }

  if (agent.currentNodeId === edge.from) {
    return getNode(graph, edge.to);
  }

  if (agent.currentNodeId === edge.to) {
    if (!edge.bidirectional) {
      throw new Error(
        `Agent ${agent.id} cannot traverse edge ${edge.id} in reverse.`,
      );
    }

    return getNode(graph, edge.from);
  }

  throw new Error(
    `Agent ${agent.id} current node is not connected to edge ${edge.id}.`,
  );
}

/**
 * Begins traversal of a navigation edge.
 *
 * The agent remains associated with the source node until the
 * destination node is reached. currentEdgeId identifies the edge
 * currently being traversed.
 */
export function beginEdgeTraversal(
  agent: AgentState,
  graph: NavigationGraph,
  edgeId: string,
): void {
  if (agent.status !== "ACTIVE") {
    throw new Error(
      `Only ACTIVE agents may begin edge traversal.`,
    );
  }

  if (agent.currentEdgeId !== null) {
    throw new Error(
      `Agent ${agent.id} is already traversing an edge.`,
    );
  }

  const edge = getEdge(graph, edgeId);

  getDestinationNode(
    agent,
    edge,
    graph,
  );

  agent.currentEdgeId = edge.id;
}

/**
 * Advances one ACTIVE agent along its currently assigned edge.
 *
 * Movement distance is:
 *
 * distance = speed × timestep
 *
 * This baseline implementation does not yet include density,
 * congestion, bottleneck capacity, hazards, or collision effects.
 */
export function advanceAgentAlongCurrentEdge(
  agent: AgentState,
  graph: NavigationGraph,
  deltaSeconds: number,
  effectiveSpeedMps: number =
    agent.desiredSpeedMps,
): MovementStepResult {
  if (
    !Number.isFinite(deltaSeconds) ||
    deltaSeconds <= 0
  ) {
    throw new Error(
      "Movement timestep must be positive and finite.",
    );
  }

  if (
    !Number.isFinite(effectiveSpeedMps) ||
    effectiveSpeedMps <= 0
  ) {
    throw new Error(
      "Movement speed must be positive and finite.",
    );
  }

  if (agent.status !== "ACTIVE") {
    return {
      distanceMovedMeters: 0,
      arrivedAtNodeId: null,
      unusedDistanceMeters: 0,
    };
  }

  if (agent.currentEdgeId === null) {
    throw new Error(
      `Agent ${agent.id} is not currently traversing an edge.`,
    );
  }

  const edge = getEdge(
    graph,
    agent.currentEdgeId,
  );

  const destination =
    getDestinationNode(
      agent,
      edge,
      graph,
    );

  const dx =
    destination.position.x -
    agent.position.x;

  const dy =
    destination.position.y -
    agent.position.y;

  const remainingDistance =
    Math.hypot(dx, dy);

  const movementBudget =
    effectiveSpeedMps *
    deltaSeconds;

  const tolerance = 1e-9;

  if (
    remainingDistance <= tolerance
  ) {
    agent.position = {
      x: destination.position.x,
      y: destination.position.y,
    };

    agent.currentNodeId =
      destination.id;

    agent.currentEdgeId = null;

    return {
      distanceMovedMeters: 0,
      arrivedAtNodeId:
        destination.id,
      unusedDistanceMeters:
        movementBudget,
    };
  }

  if (
    movementBudget + tolerance >=
    remainingDistance
  ) {
    agent.position = {
      x: destination.position.x,
      y: destination.position.y,
    };

    agent.distanceTraveledMeters +=
      remainingDistance;

    agent.currentNodeId =
      destination.id;

    agent.currentEdgeId = null;

    return {
      distanceMovedMeters:
        remainingDistance,

      arrivedAtNodeId:
        destination.id,

      unusedDistanceMeters:
        Math.max(
          0,
          movementBudget -
            remainingDistance,
        ),
    };
  }

  const movementFraction =
    movementBudget /
    remainingDistance;

  agent.position = {
    x:
      agent.position.x +
      dx * movementFraction,

    y:
      agent.position.y +
      dy * movementFraction,
  };

  agent.distanceTraveledMeters +=
    movementBudget;

  return {
    distanceMovedMeters:
      movementBudget,

    arrivedAtNodeId: null,

    unusedDistanceMeters: 0,
  };
}