import {
  estimateCongestedEdgeTravelTimeSeconds,
  type QueueDelayByEdge,
} from "./congestionAwarePolicy";
import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";
import { findLexicographicShortestPath } from "./lexicographicDijkstra";

import type { DensitySnapshot } from "../types/density";
import type {
  ExitId,
  ExitSet,
} from "../types/exit";
import type {
  NavigationGraph,
  NavigationNodeId,
} from "../types/navigation";
import type { RoutingPath } from "../types/routing";

export interface AdaptiveHybridRoutingDecision {
  /**
   * Exit selected by the hybrid candidate-route evaluator.
   */
  readonly targetExitId: ExitId;

  /**
   * Predicted time associated with currently RISK-classified
   * traversal segments.
   *
   * Queue delay is included when it belongs to an edge whose
   * zone is currently RISK.
   */
  readonly predictedRiskExposureSeconds: number;

  /**
   * Predicted current travel time including:
   *
   * - density-dependent walking speed
   * - current queue delay
   */
  readonly estimatedTravelTimeSeconds: number;

  readonly path: RoutingPath;
}

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

    if (
      node.type !== "EXIT"
    ) {
      throw new Error(
        `Navigation node ${exit.id} must have type EXIT.`,
      );
    }
  }
}

function validateDynamicInputs(
  graph: NavigationGraph,
  densitySnapshot: DensitySnapshot,
  queueDelayByEdge: QueueDelayByEdge,
): void {
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

  const edgeIds =
    new Set(
      graph.edges.map(
        (edge) => edge.id,
      ),
    );

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
 * Adaptive Hybrid candidate-route evaluator.
 *
 * Objective order:
 *
 * 1. BLOCKED routes are unavailable.
 * 2. Minimize predicted exposure time associated with RISK zones.
 * 3. Among equally safe alternatives, minimize current predicted
 *    travel time using density and queue information.
 *
 * This function deliberately does not decide whether an agent
 * should abandon its current route.
 *
 * Rerouting inertia and the relative-improvement threshold are
 * handled by a separate decision layer so they can be tuned,
 * frozen, logged, and tested independently.
 *
 * Only current simulation state is used. The policy receives no
 * future congestion, hazard, or disruption information.
 */
export function routeByAdaptiveHybridPolicy(
  startNodeId: NavigationNodeId,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
  densitySnapshot: DensitySnapshot,
  queueDelayByEdge: QueueDelayByEdge = {},
): AdaptiveHybridRoutingDecision | null {
  validateLayouts(
    graph,
    exits,
    hazardField,
  );

  validateExitNodes(
    graph,
    exits,
  );

  validateDynamicInputs(
    graph,
    densitySnapshot,
    queueDelayByEdge,
  );

  const startExists =
    graph.nodes.some(
      (node) =>
        node.id === startNodeId,
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
      .map(
        (exit) => exit.id,
      );

  if (
    availableExitIds.length === 0
  ) {
    return null;
  }

  const path =
    findLexicographicShortestPath(
      graph,
      startNodeId,
      availableExitIds,
      {
        isTraversalAllowed:
          ({ edge }) =>
            hazardField.isEdgeTraversable(
              edge,
            ),

        traversalCost:
          ({ edge }) => {
            const queueDelaySeconds =
              queueDelayByEdge[
                edge.id
              ] ?? 0;

            const dynamicTravelTimeSeconds =
              estimateCongestedEdgeTravelTimeSeconds(
                edge,
                densitySnapshot,
                queueDelaySeconds,
              );

            /**
             * If this edge belongs to a RISK zone, the current
             * predicted time associated with that traversal is
             * counted as risk exposure.
             *
             * This includes queue delay because waiting associated
             * with a risky traversal also consumes exposure time
             * in the current simplified hazard model.
             */
            const riskExposureSeconds =
              hazardField.isEdgeRisky(
                edge,
              )
                ? dynamicTravelTimeSeconds
                : 0;

            return {
              primaryCost:
                riskExposureSeconds,

              secondaryCost:
                dynamicTravelTimeSeconds,
            };
          },
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
      `Adaptive Hybrid target ${path.targetNodeId} is not a defined exit.`,
    );
  }

  return {
    targetExitId:
      selectedExit.id,

    predictedRiskExposureSeconds:
      path.primaryCost,

    estimatedTravelTimeSeconds:
      path.secondaryCost,

    path,
  };
}