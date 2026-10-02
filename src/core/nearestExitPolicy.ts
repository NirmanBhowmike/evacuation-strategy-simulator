import { findShortestPathDijkstra } from "./dijkstra";
import { DynamicDisruptionController } from "./DynamicDisruptionController";
import { HazardField } from "./HazardField";

import type { ExitId, ExitSet } from "../types/exit";
import type {
  NavigationGraph,
  NavigationNode,
  NavigationNodeId,
} from "../types/navigation";
import type { RoutingPath } from "../types/routing";

export interface NearestExitRoutingDecision {
  /**
   * Exit selected by the nearest-exit policy.
   */
  readonly targetExitId: ExitId;

  /**
   * Straight-line distance from the current navigation node
   * to the selected exit.
   */
  readonly straightLineDistanceMeters: number;

  /**
   * Actual network route to the selected exit.
   */
  readonly path: RoutingPath;
}

interface ExitCandidate {
  readonly exitId: ExitId;
  readonly straightLineDistanceMeters: number;
}

function getNode(
  graph: NavigationGraph,
  nodeId: NavigationNodeId,
): NavigationNode {
  const node = graph.nodes.find(
    (candidate) =>
      candidate.id === nodeId,
  );

  if (!node) {
    throw new Error(
      `Navigation node not found: ${nodeId}`,
    );
  }

  return node;
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

/**
 * Selects the Euclidean-nearest currently available and reachable
 * exit, then computes the network path to that exit.
 *
 * Policy characteristics:
 *
 * - exit ranking uses straight-line distance
 * - congestion is ignored
 * - RISK zones are still traversable
 * - BLOCKED zones are excluded
 * - dynamically blocked exits are excluded
 *
 * If the nearest available exit has no feasible network path,
 * the policy tries the next-nearest exit.
 */
export function routeToNearestExit(
  startNodeId: NavigationNodeId,
  graph: NavigationGraph,
  exits: ExitSet,
  hazardField: HazardField,
  disruptions: DynamicDisruptionController,
): NearestExitRoutingDecision | null {
  validateLayouts(
    graph,
    exits,
    hazardField,
  );

  const startNode =
    getNode(
      graph,
      startNodeId,
    );

  const candidates:
    ExitCandidate[] = [];

  for (const exit of exits.exits) {
    if (
      !disruptions.isExitAvailable(
        exit.id,
      )
    ) {
      continue;
    }

    const exitNode =
      graph.nodes.find(
        (node) =>
          node.id === exit.id,
      );

    if (!exitNode) {
      throw new Error(
        `Navigation node not found for exit: ${exit.id}`,
      );
    }

    if (
      exitNode.type !== "EXIT"
    ) {
      throw new Error(
        `Navigation node ${exit.id} must have type EXIT.`,
      );
    }

    const dx =
      exit.position.x -
      startNode.position.x;

    const dy =
      exit.position.y -
      startNode.position.y;

    candidates.push({
      exitId:
        exit.id,

      straightLineDistanceMeters:
        Math.hypot(
          dx,
          dy,
        ),
    });
  }

  /**
   * Deterministic tie-breaking:
   *
   * 1. smaller Euclidean distance
   * 2. lexicographically smaller exit id
   */
  candidates.sort(
    (first, second) => {
      const tolerance = 1e-12;

      if (
        first.straightLineDistanceMeters <
        second.straightLineDistanceMeters -
          tolerance
      ) {
        return -1;
      }

      if (
        first.straightLineDistanceMeters >
        second.straightLineDistanceMeters +
          tolerance
      ) {
        return 1;
      }

      return first.exitId.localeCompare(
        second.exitId,
      );
    },
  );

  for (const candidate of candidates) {
    const path =
      findShortestPathDijkstra(
        graph,
        startNodeId,
        [
          candidate.exitId,
        ],
        {
          /**
           * Nearest Exit does not avoid RISK.
           *
           * It only excludes physically BLOCKED movement segments.
           */
          isTraversalAllowed:
            ({ edge }) =>
              hazardField.isEdgeTraversable(
                edge,
              ),
        },
      );

    if (!path) {
      continue;
    }

    return {
      targetExitId:
        candidate.exitId,

      straightLineDistanceMeters:
        candidate.straightLineDistanceMeters,

      path,
    };
  }

  return null;
}