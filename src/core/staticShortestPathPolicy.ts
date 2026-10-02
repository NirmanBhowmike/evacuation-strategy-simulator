import { findShortestPathDijkstra } from "./dijkstra";
import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";

import type { ExitId, ExitSet } from "../types/exit";
import type {
  NavigationGraph,
  NavigationNodeId,
} from "../types/navigation";
import type { RoutingPath } from "../types/routing";

export interface StaticShortestPathDecision {
  /**
   * Exit reached by the minimum-distance network route.
   */
  readonly targetExitId: ExitId;

  /**
   * Minimum traversable network distance to the exit.
   */
  readonly networkDistanceMeters: number;

  /**
   * Complete network path to the selected exit.
   */
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

    if (node.type !== "EXIT") {
      throw new Error(
        `Navigation node ${exit.id} must have type EXIT.`,
      );
    }
  }
}

/**
 * Computes the minimum-distance path from the current node to any
 * currently available exit.
 *
 * Policy characteristics:
 *
 * - optimizes network distance
 * - ignores congestion
 * - ignores RISK as a routing penalty
 * - excludes BLOCKED traversal segments
 * - excludes dynamically blocked exits
 *
 * "Static" refers to how this policy will later be used by the
 * simulation controller: the selected path is retained unless it
 * becomes infeasible. This function performs the route calculation
 * itself and does not decide when replanning should occur.
 */
export function routeByStaticShortestPath(
  startNodeId: NavigationNodeId,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
): StaticShortestPathDecision | null {
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
        /**
         * Static Shortest Path does not penalize RISK.
         *
         * Only physically BLOCKED traversal segments are removed.
         */
        isTraversalAllowed:
          ({ edge }) =>
            hazardField.isEdgeTraversable(
              edge,
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
      `Shortest-path target ${path.targetNodeId} is not a defined exit.`,
    );
  }

  return {
    targetExitId:
      selectedExit.id,

    networkDistanceMeters:
      path.totalCost,

    path,
  };
}