import {
  calculateWeidmannSpeedMps,
  WEIDMANN_FREE_FLOW_SPEED_MPS,
} from "./congestionEffects";
import { findShortestPathDijkstra } from "./dijkstra";
import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";

import type { DensitySnapshot } from "../types/density";
import type { ExitId, ExitSet } from "../types/exit";
import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNodeId,
} from "../types/navigation";
import type { RoutingPath } from "../types/routing";

export interface CongestionAwareRoutingDecision {
  readonly targetExitId: ExitId;

  /**
   * Estimated current travel time to the selected exit.
   */
  readonly estimatedTravelTimeSeconds: number;

  readonly path: RoutingPath;
}

/**
 * Optional current queue-delay estimate for navigation edges.
 *
 * Key:
 * navigation edge id
 *
 * Value:
 * estimated waiting time in seconds
 */
export type QueueDelayByEdge =
  Readonly<Record<string, number>>;

/**
 * Numerical guard only.
 *
 * This is not a pedestrian-behavior parameter. It prevents a
 * density-derived speed of exactly zero from creating Infinity
 * inside the routing solver.
 */
const NUMERICAL_MINIMUM_SPEED_MPS =
  1e-6;

function validateLayouts(
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
): void {
  if (
    graph.layoutId !== exits.layoutId ||
    graph.layoutId !== hazardField.layoutId
  ) {
    throw new Error(
      "Navigation graph, exit set, and hazard field must use the same layout.",
    );
  }
}

function validateExitNodes(
  graph: NavigationGraph,
  exits: ExitSet,
): void {
  for (const exit of exits.exits) {
    const node =
      graph.nodes.find(
        (candidate) =>
          candidate.id === exit.id,
      );

    if (!node) {
      throw new Error(
        `Navigation node not found for exit: ${exit.id}`,
      );
    }

    if (node.type !== "EXIT") {
      throw new Error(
        `Navigation node ${exit.id} must have type EXIT.`,
      );
    }
  }
}

function validateCongestionInputs(
  graph: NavigationGraph,
  densitySnapshot: DensitySnapshot,
  queueDelayByEdge: QueueDelayByEdge,
): void {
  const edgeIds =
    new Set(
      graph.edges.map(
        (edge) => edge.id,
      ),
    );

  if (
    !Number.isFinite(
      densitySnapshot.cellLengthMeters,
    ) ||
    densitySnapshot.cellLengthMeters <= 0
  ) {
    throw new Error(
      "Density snapshot cell length must be positive and finite.",
    );
  }

  for (
    const cell of
      densitySnapshot.cells
  ) {
    if (
      !edgeIds.has(
        cell.edgeId,
      )
    ) {
      throw new Error(
        `Density snapshot references unknown edge: ${cell.edgeId}`,
      );
    }

    if (
      !Number.isFinite(
        cell.lengthMeters,
      ) ||
      cell.lengthMeters <= 0
    ) {
      throw new Error(
        `Density cell on edge ${cell.edgeId} must have positive finite length.`,
      );
    }

    if (
      !Number.isFinite(
        cell.densityPersonsPerSquareMeter,
      ) ||
      cell.densityPersonsPerSquareMeter < 0
    ) {
      throw new Error(
        `Density cell on edge ${cell.edgeId} must have non-negative finite density.`,
      );
    }
  }

  for (
    const [
      edgeId,
      delaySeconds,
    ] of Object.entries(
      queueDelayByEdge,
    )
  ) {
    if (
      !edgeIds.has(edgeId)
    ) {
      throw new Error(
        `Queue-delay input references unknown edge: ${edgeId}`,
      );
    }

    if (
      !Number.isFinite(
        delaySeconds,
      ) ||
      delaySeconds < 0
    ) {
      throw new Error(
        `Queue delay for edge ${edgeId} must be non-negative and finite.`,
      );
    }
  }
}

/**
 * Estimates current traversal time for one navigation edge.
 *
 * Where density cells are available, each observed portion of
 * the edge receives a density-dependent pedestrian speed.
 *
 * Any portion without a density observation uses free-flow speed.
 *
 * Queue delay is then added once to the edge traversal.
 */
export function estimateCongestedEdgeTravelTimeSeconds(
  edge: NavigationEdge,
  densitySnapshot: DensitySnapshot,
  queueDelaySeconds = 0,
): number {
  if (
    !Number.isFinite(
      queueDelaySeconds,
    ) ||
    queueDelaySeconds < 0
  ) {
    throw new Error(
      "Queue delay must be non-negative and finite.",
    );
  }

  const cells =
    densitySnapshot.cells
      .filter(
        (cell) =>
          cell.edgeId ===
          edge.id,
      )
      .sort(
        (first, second) =>
          first.startDistanceMeters -
          second.startDistanceMeters,
      );

  if (
    cells.length === 0
  ) {
    return (
      edge.lengthMeters /
        WEIDMANN_FREE_FLOW_SPEED_MPS +
      queueDelaySeconds
    );
  }

  let observedLengthMeters = 0;
  let travelTimeSeconds = 0;

  for (const cell of cells) {
    const densitySpeed =
      calculateWeidmannSpeedMps(
        cell.densityPersonsPerSquareMeter,
      );

    const effectiveSpeed =
      Math.max(
        densitySpeed,
        NUMERICAL_MINIMUM_SPEED_MPS,
      );

    travelTimeSeconds +=
      cell.lengthMeters /
      effectiveSpeed;

    observedLengthMeters +=
      cell.lengthMeters;
  }

  const tolerance = 1e-9;

  if (
    observedLengthMeters >
    edge.lengthMeters +
      tolerance
  ) {
    throw new Error(
      `Density cells exceed the length of edge ${edge.id}.`,
    );
  }

  const unobservedLengthMeters =
    Math.max(
      0,
      edge.lengthMeters -
        observedLengthMeters,
    );

  travelTimeSeconds +=
    unobservedLengthMeters /
    WEIDMANN_FREE_FLOW_SPEED_MPS;

  return (
    travelTimeSeconds +
    queueDelaySeconds
  );
}

/**
 * Chooses the currently available exit with the minimum estimated
 * current travel time.
 *
 * Dynamic cost includes:
 *
 * - density-adjusted traversal time
 * - current queue/bottleneck delay
 *
 * Policy characteristics:
 *
 * - responds to current congestion
 * - does not penalize RISK
 * - excludes BLOCKED routes
 * - excludes dynamically blocked exits
 *
 * The policy uses current state only. It does not receive future
 * hazard, congestion, or disruption information.
 */
export function routeByCongestionAwarePolicy(
  startNodeId: NavigationNodeId,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
  densitySnapshot: DensitySnapshot,
  queueDelayByEdge: QueueDelayByEdge = {},
): CongestionAwareRoutingDecision | null {
  validateLayouts(
    graph,
    exits,
    hazardField,
  );

  validateExitNodes(
    graph,
    exits,
  );

  validateCongestionInputs(
    graph,
    densitySnapshot,
    queueDelayByEdge,
  );

  const startExists =
    graph.nodes.some(
      (node) =>
        node.id ===
        startNodeId,
    );

  if (!startExists) {
    throw new Error(
      `Navigation node not found: ${startNodeId}`,
    );
  }

  const availableExitIds =
    exits.exits
      .filter((exit) =>
        disruptions.isExitAvailable(
          exit.id,
        ),
      )
      .map((exit) => exit.id);

  if (
    availableExitIds.length === 0
  ) {
    return null;
  }

  const path =
    findShortestPathDijkstra(
      graph,
      startNodeId,
      availableExitIds,
      {
        isTraversalAllowed:
          ({ edge }) =>
            hazardField.isEdgeTraversable(
              edge,
            ),

        edgeCost:
          ({ edge }) =>
            estimateCongestedEdgeTravelTimeSeconds(
              edge,
              densitySnapshot,
              queueDelayByEdge[
                edge.id
              ] ?? 0,
            ),
      },
    );

  if (!path) {
    return null;
  }

  const selectedExit =
    exits.exits.find(
      (exit) =>
        exit.id ===
        path.targetNodeId,
    );

  if (!selectedExit) {
    throw new Error(
      `Congestion-aware target ${path.targetNodeId} is not a defined exit.`,
    );
  }

  return {
    targetExitId:
      selectedExit.id,

    estimatedTravelTimeSeconds:
      path.totalCost,

    path,
  };
}