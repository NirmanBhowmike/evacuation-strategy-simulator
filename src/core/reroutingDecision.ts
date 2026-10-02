import {
  estimateCongestedEdgeTravelTimeSeconds,
} from "./congestionAwarePolicy";

import type {
  NavigationEdge,
} from "../types/navigation";
import type {
  RoutingPath,
} from "../types/routing";
import type {
  ReroutingDecisionInput,
  ReroutingDecisionResult,
  RouteAssessment,
} from "../types/rerouting";
import type {
  RoutingStrategyContext,
} from "../types/routingStrategy";

export const ADAPTIVE_REROUTE_THRESHOLD_CANDIDATES =
  Object.freeze([
    0,
    0.10,
    0.20,
    0.30,
  ] as const);

const TOLERANCE = 1e-12;

function validateThreshold(
  threshold: number,
): void {
  if (
    !Number.isFinite(
      threshold,
    ) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new Error(
      "Rerouting threshold must be finite and between 0 and 1.",
    );
  }
}

function getHazardState(
  context:
    RoutingStrategyContext,
  zoneId: string,
) {
  const zone =
    context.current
      .hazardZones
      .find(
        (candidate) =>
          candidate.zoneId ===
          zoneId,
      );

  if (!zone) {
    throw new Error(
      `Routing context has no hazard state for zone: ${zoneId}`,
    );
  }

  return zone.state;
}

function getPathTraversalEdge(
  context:
    RoutingStrategyContext,
  path:
    RoutingPath,
  edgeIndex: number,
): NavigationEdge {
  const edgeId =
    path.edgeIds[
      edgeIndex
    ];

  const fromNodeId =
    path.nodeIds[
      edgeIndex
    ];

  const toNodeId =
    path.nodeIds[
      edgeIndex + 1
    ];

  if (
    edgeId === undefined ||
    fromNodeId === undefined ||
    toNodeId === undefined
  ) {
    throw new Error(
      "Routing path has inconsistent node and edge sequences.",
    );
  }

  const edge =
    context.graph.edges.find(
      (candidate) =>
        candidate.id === edgeId,
    );

  if (!edge) {
    throw new Error(
      `Routing path references unknown edge: ${edgeId}`,
    );
  }

  const forward =
    edge.from ===
      fromNodeId &&
    edge.to ===
      toNodeId;

  const reverse =
    edge.bidirectional &&
    edge.to ===
      fromNodeId &&
    edge.from ===
      toNodeId;

  if (
    !forward &&
    !reverse
  ) {
    throw new Error(
      `Routing path edge ${edge.id} does not connect ${fromNodeId} to ${toNodeId}.`,
    );
  }

  return edge;
}

/**
 * Re-evaluates an existing route under CURRENT simulation state.
 *
 * This allows the rerouting controller to compare the current
 * route with an Adaptive Hybrid candidate using exactly the same
 * current density, queue, hazard, and exit information.
 */
export function assessCurrentRoutingPath(
  context:
    RoutingStrategyContext,
  path:
    RoutingPath,
): RouteAssessment {
  if (
    path.nodeIds.length ===
    0
  ) {
    throw new Error(
      "Routing path must contain at least one node.",
    );
  }

  if (
    path.edgeIds.length !==
    path.nodeIds.length - 1
  ) {
    throw new Error(
      "Routing path must contain exactly one fewer edge than nodes.",
    );
  }

  if (
    path.nodeIds[0] !==
    context.startNodeId
  ) {
    throw new Error(
      "Current routing path must begin at the routing context start node.",
    );
  }

  if (
    path.targetNodeId !==
    path.nodeIds[
      path.nodeIds.length - 1
    ]
  ) {
    throw new Error(
      "Routing path target must match the final path node.",
    );
  }

  const definedExit =
    context.exits.exits.some(
      (exit) =>
        exit.id ===
        path.targetNodeId,
    );

  if (!definedExit) {
    throw new Error(
      `Routing path target is not a defined exit: ${path.targetNodeId}`,
    );
  }

  const blockedExitIds =
    new Set(
      context.current
        .blockedExitIds,
    );

  const isTargetExitUnavailable =
    blockedExitIds.has(
      path.targetNodeId,
    );

  let isRouteBlocked =
    false;

  let predictedRiskExposureSeconds =
    0;

  let estimatedTravelTimeSeconds =
    0;

  for (
    let index = 0;
    index <
      path.edgeIds.length;
    index += 1
  ) {
    const edge =
      getPathTraversalEdge(
        context,
        path,
        index,
      );

    const hazardState =
      getHazardState(
        context,
        edge.zoneId,
      );

    if (
      hazardState ===
      "BLOCKED"
    ) {
      isRouteBlocked =
        true;

      /**
       * A blocked route no longer has a meaningful feasible
       * travel-time estimate.
       *
       * We still continue validation of the path structure but
       * do not rely on the final travel time for the forced
       * rerouting decision.
       */
    }

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

    estimatedTravelTimeSeconds +=
      travelTime;

    if (
      hazardState ===
      "RISK"
    ) {
      predictedRiskExposureSeconds +=
        travelTime;
    }
  }

  return {
    isRouteBlocked,

    isTargetExitUnavailable,

    predictedRiskExposureSeconds,

    estimatedTravelTimeSeconds,
  };
}

function pathsAreEqual(
  first:
    RoutingPath,
  second:
    RoutingPath,
): boolean {
  if (
    first.targetNodeId !==
    second.targetNodeId
  ) {
    return false;
  }

  if (
    first.edgeIds.length !==
    second.edgeIds.length
  ) {
    return false;
  }

  for (
    let index = 0;
    index <
      first.edgeIds.length;
    index += 1
  ) {
    if (
      first.edgeIds[index] !==
      second.edgeIds[index]
    ) {
      return false;
    }
  }

  return true;
}

function calculateRelativeImprovement(
  currentCost: number,
  alternativeCost: number,
): number {
  if (
    currentCost <=
    TOLERANCE
  ) {
    return 0;
  }

  return (
    currentCost -
    alternativeCost
  ) / currentCost;
}

/**
 * Decides whether an agent should abandon its current route.
 *
 * Decision hierarchy:
 *
 * 1. Current route blocked -> forced reroute if possible.
 * 2. Current target exit unavailable -> forced reroute if possible.
 * 3. Congestion update alone -> no mid-route reevaluation.
 * 4. Safer candidate -> reroute regardless of time threshold.
 * 5. Less-safe candidate -> retain current route.
 * 6. Equal safety -> apply relative travel-time improvement
 *    threshold.
 *
 * This keeps route evaluation separate from rerouting inertia,
 * which allows theta to be tuned on the development layout and
 * frozen before holdout evaluation.
 */
export function decideAdaptiveRerouting(
  context:
    RoutingStrategyContext,
  currentPath:
    RoutingPath,
  input:
    ReroutingDecisionInput,
): ReroutingDecisionResult {
  validateThreshold(
    input.threshold,
  );

  const current =
    assessCurrentRoutingPath(
      context,
      currentPath,
    );

  if (
    input.candidate ===
    null
  ) {
    if (
      current.isRouteBlocked ||
      current.isTargetExitUnavailable
    ) {
      return {
        action:
          "NO_FEASIBLE_ALTERNATIVE",

        reason:
          "NO_FEASIBLE_ALTERNATIVE",

        threshold:
          input.threshold,

        relativeImprovement:
          null,

        current,

        candidate:
          null,
      };
    }

    return {
      action:
        "KEEP_CURRENT",

      reason:
        "NO_FEASIBLE_ALTERNATIVE",

      threshold:
        input.threshold,

      relativeImprovement:
        null,

      current,

      candidate:
        null,
    };
  }

  const candidate =
    assessCurrentRoutingPath(
      context,
      input.candidate.path,
    );

  /**
   * A candidate produced through the current-state strategy
   * interface should itself be feasible.
   */
  if (
    candidate.isRouteBlocked ||
    candidate.isTargetExitUnavailable
  ) {
    throw new Error(
      "Rerouting candidate must be feasible under current simulation state.",
    );
  }

  if (
    current.isRouteBlocked
  ) {
    return {
      action:
        "REROUTE",

      reason:
        "CURRENT_ROUTE_BLOCKED",

      threshold:
        input.threshold,

      relativeImprovement:
        null,

      current,

      candidate,
    };
  }

  if (
    current.isTargetExitUnavailable
  ) {
    return {
      action:
        "REROUTE",

      reason:
        "CURRENT_EXIT_UNAVAILABLE",

      threshold:
        input.threshold,

      relativeImprovement:
        null,

      current,

      candidate,
    };
  }

  if (
    pathsAreEqual(
      currentPath,
      input.candidate.path,
    )
  ) {
    return {
      action:
        "KEEP_CURRENT",

      reason:
        "SAME_ROUTE",

      threshold:
        input.threshold,

      relativeImprovement:
        0,

      current,

      candidate,
    };
  }

  /**
   * Congestion fluctuations alone do not cause mid-route
   * switching. Normal congestion-based reevaluation occurs when
   * the simulation reaches a decision node.
   */
  if (
    input.trigger ===
    "CONGESTION_UPDATE"
  ) {
    return {
      action:
        "NOT_EVALUATED",

      reason:
        "CONGESTION_UPDATE_OUTSIDE_DECISION_NODE",

      threshold:
        input.threshold,

      relativeImprovement:
        null,

      current,

      candidate,
    };
  }

  const candidateSafer =
    candidate
      .predictedRiskExposureSeconds <
    current
      .predictedRiskExposureSeconds -
      TOLERANCE;

  if (candidateSafer) {
    return {
      action:
        "REROUTE",

      reason:
        "SAFER_ALTERNATIVE",

      threshold:
        input.threshold,

      relativeImprovement:
        calculateRelativeImprovement(
          current
            .estimatedTravelTimeSeconds,
          candidate
            .estimatedTravelTimeSeconds,
        ),

      current,

      candidate,
    };
  }

  const candidateLessSafe =
    candidate
      .predictedRiskExposureSeconds >
    current
      .predictedRiskExposureSeconds +
      TOLERANCE;

  if (candidateLessSafe) {
    return {
      action:
        "KEEP_CURRENT",

      reason:
        "CANDIDATE_LESS_SAFE",

      threshold:
        input.threshold,

      relativeImprovement:
        calculateRelativeImprovement(
          current
            .estimatedTravelTimeSeconds,
          candidate
            .estimatedTravelTimeSeconds,
        ),

      current,

      candidate,
    };
  }

  const relativeImprovement =
    calculateRelativeImprovement(
      current
        .estimatedTravelTimeSeconds,
      candidate
        .estimatedTravelTimeSeconds,
    );

  if (
    relativeImprovement +
      TOLERANCE >=
    input.threshold
  ) {
    return {
      action:
        "REROUTE",

      reason:
        "IMPROVEMENT_THRESHOLD_MET",

      threshold:
        input.threshold,

      relativeImprovement,

      current,

      candidate,
    };
  }

  return {
    action:
      "KEEP_CURRENT",

    reason:
      "IMPROVEMENT_THRESHOLD_NOT_MET",

    threshold:
      input.threshold,

    relativeImprovement,

    current,

    candidate,
  };
}