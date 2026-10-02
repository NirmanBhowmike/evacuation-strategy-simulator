import type { ExitId } from "./exit";
import type {
  ReroutingAction,
  ReroutingReviewTrigger,
} from "./rerouting";
import type { RoutingStrategyId } from "./routingStrategy";

export type DecisionTraceEventType =
  | "INITIAL_ROUTE"
  | "REROUTE_REVIEW";

export type DecisionTraceAction =
  | ReroutingAction
  | "ROUTE_ASSIGNED";

export type DecisionTraceReasonCode =
  | "INITIAL_ROUTE"
  | "NEAREST_EXIT"
  | "STATIC_SHORTEST"
  | "CONGESTION_IMPROVEMENT"
  | "HAZARD_AVOIDANCE"
  | "EXIT_UNAVAILABLE"
  | "ROUTE_BLOCKED"
  | "DECISION_NODE_REVIEW"
  | "REROUTE_THRESHOLD_MET"
  | "REROUTE_THRESHOLD_NOT_MET"
  | "NO_FEASIBLE_ALTERNATIVE"
  | "SAME_ROUTE"
  | "CANDIDATE_LESS_SAFE"
  | "CONGESTION_UPDATE_OUTSIDE_DECISION_NODE";

export interface DecisionTraceEntry {
  /**
   * Deterministic event sequence within one simulation run.
   */
  readonly sequence: number;

  readonly eventId: string;

  readonly agentId: string;

  readonly simulationTimeSeconds: number;

  readonly eventType:
    DecisionTraceEventType;

  readonly strategyId:
    RoutingStrategyId | null;

  readonly trigger:
    ReroutingReviewTrigger | null;

  readonly reasonCodes:
    readonly DecisionTraceReasonCode[];

  readonly action:
    DecisionTraceAction;

  readonly currentTargetExitId:
    ExitId | null;

  readonly candidateTargetExitId:
    ExitId | null;

  readonly selectedTargetExitId:
    ExitId | null;

  readonly threshold:
    number | null;

  readonly relativeImprovement:
    number | null;

  readonly currentPredictedRiskExposureSeconds:
    number | null;

  readonly candidatePredictedRiskExposureSeconds:
    number | null;

  readonly currentEstimatedTravelTimeSeconds:
    number | null;

  readonly candidateEstimatedTravelTimeSeconds:
    number | null;

  readonly currentEdgeIds:
    readonly string[];

  readonly candidateEdgeIds:
    readonly string[];

  readonly routeChanged: boolean;
}