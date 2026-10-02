import type { RoutingStrategyDecision } from "./routingStrategy";

export type ReroutingReviewTrigger =
  | "DECISION_NODE_REVIEW"
  | "HAZARD_CHANGE"
  | "CONGESTION_UPDATE";

export type ReroutingAction =
  | "KEEP_CURRENT"
  | "REROUTE"
  | "NOT_EVALUATED"
  | "NO_FEASIBLE_ALTERNATIVE";

export type ReroutingDecisionReason =
  | "CONGESTION_UPDATE_OUTSIDE_DECISION_NODE"
  | "CURRENT_ROUTE_BLOCKED"
  | "CURRENT_EXIT_UNAVAILABLE"
  | "SAFER_ALTERNATIVE"
  | "CANDIDATE_LESS_SAFE"
  | "IMPROVEMENT_THRESHOLD_MET"
  | "IMPROVEMENT_THRESHOLD_NOT_MET"
  | "SAME_ROUTE"
  | "NO_FEASIBLE_ALTERNATIVE";

export interface RouteAssessment {
  readonly isRouteBlocked: boolean;

  readonly isTargetExitUnavailable: boolean;

  readonly predictedRiskExposureSeconds: number;

  readonly estimatedTravelTimeSeconds: number;
}

export interface ReroutingDecisionInput {
  readonly trigger:
    ReroutingReviewTrigger;

  /**
   * Relative travel-time improvement required for a voluntary
   * route change.
   *
   * Example:
   * 0.20 means the alternative must improve predicted travel
   * time by at least 20 percent when safety is otherwise equal.
   */
  readonly threshold: number;

  readonly candidate:
    RoutingStrategyDecision | null;
}

export interface ReroutingDecisionResult {
  readonly action:
    ReroutingAction;

  readonly reason:
    ReroutingDecisionReason;

  readonly threshold: number;

  /**
   * Relative time improvement:
   *
   * (current - alternative) / current
   *
   * Null when it is not meaningful or no candidate exists.
   */
  readonly relativeImprovement:
    number | null;

  readonly current:
    RouteAssessment;

  readonly candidate:
    RouteAssessment | null;
}