import {
  estimateCongestedEdgeTravelTimeSeconds,
} from "./congestionAwarePolicy";
import {
  WEIDMANN_FREE_FLOW_SPEED_MPS,
} from "./congestionEffects";
import { findShortestPathDijkstra } from "./dijkstra";
import { findLexicographicShortestPath } from "./lexicographicDijkstra";

import type {
  ExitId,
} from "../types/exit";
import type {
  NavigationEdge,
  NavigationNodeId,
} from "../types/navigation";
import type {
  RoutingPath,
} from "../types/routing";
import type {
  RoutingStrategy,
  RoutingStrategyContext,
  RoutingStrategyDecision,
  RoutingStrategyId,
} from "../types/routingStrategy";

function validateContext(
  context: RoutingStrategyContext,
): void {
  if (
    context.layoutId !==
      context.graph.layoutId ||
    context.layoutId !==
      context.exits.layoutId
  ) {
    throw new Error(
      "Routing strategy context contains incompatible layouts.",
    );
  }

  const startExists =
    context.graph.nodes.some(
      (node) =>
        node.id ===
        context.startNodeId,
    );

  if (!startExists) {
    throw new Error(
      `Navigation node not found: ${context.startNodeId}`,
    );
  }
}

function getHazardState(
  context: RoutingStrategyContext,
  zoneId: string,
) {
  const zone =
    context.current.hazardZones.find(
      (candidate) =>
        candidate.zoneId === zoneId,
    );

  if (!zone) {
    throw new Error(
      `Routing context has no hazard state for zone: ${zoneId}`,
    );
  }

  return zone.state;
}

function isEdgeTraversable(
  context: RoutingStrategyContext,
  edge: NavigationEdge,
): boolean {
  return (
    getHazardState(
      context,
      edge.zoneId,
    ) !== "BLOCKED"
  );
}

function isEdgeRisky(
  context: RoutingStrategyContext,
  edge: NavigationEdge,
): boolean {
  return (
    getHazardState(
      context,
      edge.zoneId,
    ) === "RISK"
  );
}

function getAvailableExitIds(
  context: RoutingStrategyContext,
): readonly ExitId[] {
  const blocked =
    new Set(
      context.current
        .blockedExitIds,
    );

  return context.exits.exits
    .filter(
      (exit) =>
        !blocked.has(
          exit.id,
        ),
    )
    .map(
      (exit) =>
        exit.id,
    );
}

function validateExitNodes(
  context: RoutingStrategyContext,
): void {
  for (
    const exit of
      context.exits.exits
  ) {
    const node =
      context.graph.nodes.find(
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

function createDecision(
  strategyId: RoutingStrategyId,
  targetExitId: ExitId,
  path: RoutingPath,
  metrics: RoutingStrategyDecision["metrics"],
): RoutingStrategyDecision {
  return {
    strategyId,
    targetExitId,
    path,
    metrics,
  };
}

/**
 * NEAREST EXIT
 *
 * Select the currently available and reachable exit with the
 * smallest Euclidean distance from the current node.
 *
 * Congestion and RISK are ignored.
 * BLOCKED routes remain physically unavailable.
 */
export const nearestExitStrategy:
  RoutingStrategy = {
  id: "NEAREST_EXIT",

  route(
    context,
  ) {
    validateContext(
      context,
    );

    validateExitNodes(
      context,
    );

    const startNode =
      context.graph.nodes.find(
        (node) =>
          node.id ===
          context.startNodeId,
      )!;

    const availableExitIds =
      new Set(
        getAvailableExitIds(
          context,
        ),
      );

    const candidates =
      context.exits.exits
        .filter(
          (exit) =>
            availableExitIds.has(
              exit.id,
            ),
        )
        .map(
          (exit) => {
            const dx =
              exit.position.x -
              startNode.position.x;

            const dy =
              exit.position.y -
              startNode.position.y;

            return {
              exitId:
                exit.id,

              distance:
                Math.hypot(
                  dx,
                  dy,
                ),
            };
          },
        )
        .sort(
          (first, second) => {
            const tolerance =
              1e-12;

            if (
              first.distance <
              second.distance -
                tolerance
            ) {
              return -1;
            }

            if (
              first.distance >
              second.distance +
                tolerance
            ) {
              return 1;
            }

            return first.exitId.localeCompare(
              second.exitId,
            );
          },
        );

    for (
      const candidate of
        candidates
    ) {
      const path =
        findShortestPathDijkstra(
          context.graph,
          context.startNodeId,
          [
            candidate.exitId,
          ],
          {
            isTraversalAllowed:
              ({ edge }) =>
                isEdgeTraversable(
                  context,
                  edge,
                ),
          },
        );

      if (!path) {
        continue;
      }

      return createDecision(
        "NEAREST_EXIT",
        candidate.exitId,
        path,
        {
          straightLineDistanceMeters:
            candidate.distance,
        },
      );
    }

    return null;
  },
};

/**
 * STATIC SHORTEST PATH
 *
 * Select the available exit with minimum traversable network
 * distance.
 *
 * Congestion and RISK do not change the routing cost.
 */
export const staticShortestPathStrategy:
  RoutingStrategy = {
  id:
    "STATIC_SHORTEST_PATH",

  route(
    context,
  ) {
    validateContext(
      context,
    );

    validateExitNodes(
      context,
    );

    const availableExitIds =
      getAvailableExitIds(
        context,
      );

    if (
      availableExitIds.length ===
      0
    ) {
      return null;
    }

    const path =
      findShortestPathDijkstra(
        context.graph,
        context.startNodeId,
        availableExitIds,
        {
          isTraversalAllowed:
            ({ edge }) =>
              isEdgeTraversable(
                context,
                edge,
              ),
        },
      );

    if (!path) {
      return null;
    }

    return createDecision(
      "STATIC_SHORTEST_PATH",
      path.targetNodeId,
      path,
      {
        networkDistanceMeters:
          path.totalCost,
      },
    );
  },
};

/**
 * CONGESTION-AWARE
 *
 * Select the route with minimum current predicted travel time.
 *
 * Cost includes:
 *
 * - density-adjusted walking time
 * - current queue delay
 *
 * RISK is not penalized.
 */
export const congestionAwareStrategy:
  RoutingStrategy = {
  id:
    "CONGESTION_AWARE",

  route(
    context,
  ) {
    validateContext(
      context,
    );

    validateExitNodes(
      context,
    );

    const availableExitIds =
      getAvailableExitIds(
        context,
      );

    if (
      availableExitIds.length ===
      0
    ) {
      return null;
    }

    const path =
      findShortestPathDijkstra(
        context.graph,
        context.startNodeId,
        availableExitIds,
        {
          isTraversalAllowed:
            ({ edge }) =>
              isEdgeTraversable(
                context,
                edge,
              ),

          edgeCost:
            ({ edge }) =>
              estimateCongestedEdgeTravelTimeSeconds(
                edge,
                context.current
                  .densitySnapshot,
                context.current
                  .queueDelayByEdge[
                  edge.id
                ] ?? 0,
              ),
        },
      );

    if (!path) {
      return null;
    }

    return createDecision(
      "CONGESTION_AWARE",
      path.targetNodeId,
      path,
      {
        estimatedTravelTimeSeconds:
          path.totalCost,
      },
    );
  },
};

/**
 * HAZARD-AWARE
 *
 * Safety-first lexicographic routing:
 *
 * 1. BLOCKED edges excluded.
 * 2. Minimize predicted RISK exposure.
 * 3. Among equally safe routes, minimize free-flow travel time.
 */
export const hazardAwareStrategy:
  RoutingStrategy = {
  id:
    "HAZARD_AWARE",

  route(
    context,
  ) {
    validateContext(
      context,
    );

    validateExitNodes(
      context,
    );

    const availableExitIds =
      getAvailableExitIds(
        context,
      );

    if (
      availableExitIds.length ===
      0
    ) {
      return null;
    }

    const path =
      findLexicographicShortestPath(
        context.graph,
        context.startNodeId,
        availableExitIds,
        {
          isTraversalAllowed:
            ({ edge }) =>
              isEdgeTraversable(
                context,
                edge,
              ),

          traversalCost:
            ({ edge }) => {
              const travelTime =
                edge.lengthMeters /
                WEIDMANN_FREE_FLOW_SPEED_MPS;

              return {
                primaryCost:
                  isEdgeRisky(
                    context,
                    edge,
                  )
                    ? travelTime
                    : 0,

                secondaryCost:
                  travelTime,
              };
            },
        },
      );

    if (!path) {
      return null;
    }

    return createDecision(
      "HAZARD_AWARE",
      path.targetNodeId,
      path,
      {
        predictedRiskExposureSeconds:
          path.primaryCost,

        estimatedTravelTimeSeconds:
          path.secondaryCost,
      },
    );
  },
};

/**
 * ADAPTIVE HYBRID
 *
 * Safety-first dynamic routing:
 *
 * 1. BLOCKED edges excluded.
 * 2. Minimize current predicted RISK exposure.
 * 3. Among equally safe alternatives, minimize current
 *    congestion-adjusted travel time plus queue delay.
 *
 * The decision whether to actually switch away from an existing
 * route belongs to the separate rerouting/inertia layer.
 */
export const adaptiveHybridStrategy:
  RoutingStrategy = {
  id:
    "ADAPTIVE_HYBRID",

  route(
    context,
  ) {
    validateContext(
      context,
    );

    validateExitNodes(
      context,
    );

    const availableExitIds =
      getAvailableExitIds(
        context,
      );

    if (
      availableExitIds.length ===
      0
    ) {
      return null;
    }

    const path =
      findLexicographicShortestPath(
        context.graph,
        context.startNodeId,
        availableExitIds,
        {
          isTraversalAllowed:
            ({ edge }) =>
              isEdgeTraversable(
                context,
                edge,
              ),

          traversalCost:
            ({ edge }) => {
              const travelTime =
                estimateCongestedEdgeTravelTimeSeconds(
                  edge,
                  context.current
                    .densitySnapshot,
                  context.current
                    .queueDelayByEdge[
                    edge.id
                  ] ?? 0,
                );

              return {
                primaryCost:
                  isEdgeRisky(
                    context,
                    edge,
                  )
                    ? travelTime
                    : 0,

                secondaryCost:
                  travelTime,
              };
            },
        },
      );

    if (!path) {
      return null;
    }

    return createDecision(
      "ADAPTIVE_HYBRID",
      path.targetNodeId,
      path,
      {
        predictedRiskExposureSeconds:
          path.primaryCost,

        estimatedTravelTimeSeconds:
          path.secondaryCost,
      },
    );
  },
};

/**
 * Canonical strategy registry used by the simulation engine.
 */
export const ROUTING_STRATEGIES:
  Readonly<
    Record<
      RoutingStrategyId,
      RoutingStrategy
    >
  > = Object.freeze({
    NEAREST_EXIT:
      nearestExitStrategy,

    STATIC_SHORTEST_PATH:
      staticShortestPathStrategy,

    CONGESTION_AWARE:
      congestionAwareStrategy,

    HAZARD_AWARE:
      hazardAwareStrategy,

    ADAPTIVE_HYBRID:
      adaptiveHybridStrategy,
  });

export function getRoutingStrategy(
  strategyId:
    RoutingStrategyId,
): RoutingStrategy {
  return ROUTING_STRATEGIES[
    strategyId
  ];
}