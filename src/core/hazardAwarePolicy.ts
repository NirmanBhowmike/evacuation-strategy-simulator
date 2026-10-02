import {
  WEIDMANN_FREE_FLOW_SPEED_MPS,
} from "./congestionEffects";
import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";
import { findLexicographicShortestPath } from "./lexicographicDijkstra";

import type {
  ExitId,
  ExitSet,
} from "../types/exit";

import type {
  NavigationGraph,
  NavigationNodeId,
} from "../types/navigation";

import type { RoutingPath } from "../types/routing";

export interface HazardAwareRoutingDecision {
  readonly targetExitId:
    ExitId;

  /**
   * Predicted traversal time spent inside zones currently
   * classified RISK.
   */
  readonly predictedRiskExposureSeconds:
    number;

  /**
   * Predicted total free-flow travel time.
   */
  readonly estimatedTravelTimeSeconds:
    number;

  readonly path:
    RoutingPath;
}

function validateLayouts(
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
): void {
  if (
    graph.layoutId !==
      exits.layoutId ||
    graph.layoutId !==
      hazardField.layoutId
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
  for (
    const exit of exits.exits
  ) {
    const node =
      graph.nodes.find(
        (candidate) =>
          candidate.id ===
          exit.id,
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

/**
 * Safety-first hazard-aware routing.
 *
 * Objective order:
 *
 * 1. BLOCKED routes cannot be used.
 * 2. Among feasible routes, minimize predicted time in RISK zones.
 * 3. Among routes with equal predicted RISK exposure, minimize
 *    total travel time.
 *
 * Hazard and travel time are deliberately not collapsed into a
 * weighted sum. This keeps the safety-first policy explicit and
 * avoids an arbitrary hazard penalty coefficient.
 *
 * This policy uses the current hazard field only. It has no
 * knowledge of future hazard expansion or future disruptions.
 */
export function routeByHazardAwarePolicy(
  startNodeId:
    NavigationNodeId,
  graph:
    NavigationGraph,
  exits:
    ExitSet,
  hazardField:
    HazardField,
  disruptions:
    DynamicDisruptionController,
): HazardAwareRoutingDecision | null {
  validateLayouts(
    graph,
    exits,
    hazardField,
  );

  validateExitNodes(
    graph,
    exits,
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
      .filter(
        (exit) =>
          disruptions.isExitAvailable(
            exit.id,
          ),
      )
      .map(
        (exit) =>
          exit.id,
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
            const travelTimeSeconds =
              edge.lengthMeters /
              WEIDMANN_FREE_FLOW_SPEED_MPS;

            const riskExposureSeconds =
              hazardField.isEdgeRisky(
                edge,
              )
                ? travelTimeSeconds
                : 0;

            return {
              primaryCost:
                riskExposureSeconds,

              secondaryCost:
                travelTimeSeconds,
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
      `Hazard-aware target ${path.targetNodeId} is not a defined exit.`,
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