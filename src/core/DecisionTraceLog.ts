import type { ExitId } from "../types/exit";
import type {
  DecisionTraceEntry,
  DecisionTraceReasonCode,
} from "../types/decisionTrace";
import type {
  ReroutingDecisionInput,
  ReroutingDecisionResult,
} from "../types/rerouting";
import type { RoutingPath } from "../types/routing";
import type {
  RoutingStrategyDecision,
} from "../types/routingStrategy";

function validateAgentId(
  agentId: string,
): void {
  if (!agentId.trim()) {
    throw new Error(
      "Decision Trace agent id is required.",
    );
  }
}

function validateSimulationTime(
  simulationTimeSeconds: number,
): void {
  if (
    !Number.isFinite(
      simulationTimeSeconds,
    ) ||
    simulationTimeSeconds < 0
  ) {
    throw new Error(
      "Decision Trace time must be non-negative and finite.",
    );
  }
}

function freezeStrings(
  values: readonly string[],
): readonly string[] {
  return Object.freeze([
    ...values,
  ]);
}

function freezeReasons(
  values:
    readonly DecisionTraceReasonCode[],
): readonly DecisionTraceReasonCode[] {
  return Object.freeze([
    ...new Set(values),
  ]);
}

function createReroutingReasonCodes(
  input: ReroutingDecisionInput,
  result: ReroutingDecisionResult,
): readonly DecisionTraceReasonCode[] {
  const reasons:
    DecisionTraceReasonCode[] = [];

  if (
    input.trigger ===
    "DECISION_NODE_REVIEW"
  ) {
    reasons.push(
      "DECISION_NODE_REVIEW",
    );
  }

  switch (result.reason) {
    case "CURRENT_ROUTE_BLOCKED":
      reasons.push(
        "ROUTE_BLOCKED",
      );
      break;

    case "CURRENT_EXIT_UNAVAILABLE":
      reasons.push(
        "EXIT_UNAVAILABLE",
      );
      break;

    case "SAFER_ALTERNATIVE":
      reasons.push(
        "HAZARD_AVOIDANCE",
      );
      break;

    case "IMPROVEMENT_THRESHOLD_MET":
      reasons.push(
        "CONGESTION_IMPROVEMENT",
        "REROUTE_THRESHOLD_MET",
      );
      break;

    case "IMPROVEMENT_THRESHOLD_NOT_MET":
      reasons.push(
        "REROUTE_THRESHOLD_NOT_MET",
      );
      break;

    case "NO_FEASIBLE_ALTERNATIVE":
      reasons.push(
        "NO_FEASIBLE_ALTERNATIVE",
      );
      break;

    case "SAME_ROUTE":
      reasons.push(
        "SAME_ROUTE",
      );
      break;

    case "CANDIDATE_LESS_SAFE":
      reasons.push(
        "CANDIDATE_LESS_SAFE",
      );
      break;

    case "CONGESTION_UPDATE_OUTSIDE_DECISION_NODE":
      reasons.push(
        "CONGESTION_UPDATE_OUTSIDE_DECISION_NODE",
      );
      break;

    default: {
      const unreachable: never =
        result.reason;

      throw new Error(
        `Unsupported rerouting reason: ${String(
          unreachable,
        )}`,
      );
    }
  }

  return freezeReasons(
    reasons,
  );
}

function selectedExitAfterDecision(
  currentPath: RoutingPath,
  candidate:
    RoutingStrategyDecision | null,
  result: ReroutingDecisionResult,
): ExitId | null {
  if (
    result.action ===
    "REROUTE"
  ) {
    return (
      candidate?.targetExitId ??
      null
    );
  }

  if (
    result.action ===
    "NO_FEASIBLE_ALTERNATIVE"
  ) {
    return null;
  }

  return currentPath.targetNodeId;
}

/**
 * Deterministic in-memory Decision Trace for one simulation run.
 *
 * This class records decisions only.
 *
 * It does not:
 *
 * - select routes
 * - calculate thresholds
 * - alter AgentState
 * - apply disruptions
 *
 * Keeping logging separate prevents the explanation layer from
 * changing simulation behavior.
 */
export class DecisionTraceLog {
  private readonly entries:
    DecisionTraceEntry[] = [];

  private nextSequence = 1;

  private createEventId(
    sequence: number,
  ): string {
    return `trace-${String(
      sequence,
    ).padStart(
      6,
      "0",
    )}`;
  }

  private append(
    entry:
      Omit<
        DecisionTraceEntry,
        "sequence" | "eventId"
      >,
  ): DecisionTraceEntry {
    const sequence =
      this.nextSequence;

    this.nextSequence += 1;

    const complete =
      Object.freeze({
        ...entry,

        sequence,

        eventId:
          this.createEventId(
            sequence,
          ),
      });

    this.entries.push(
      complete,
    );

    return complete;
  }

  /**
   * Records initial route assignment.
   *
   * A null decision explicitly records that no initial feasible
   * route was available.
   */
  public recordInitialRoute(
    agentId: string,
    simulationTimeSeconds: number,
    decision:
      RoutingStrategyDecision | null,
  ): DecisionTraceEntry {
    validateAgentId(
      agentId,
    );

    validateSimulationTime(
      simulationTimeSeconds,
    );

    if (!decision) {
      return this.append({
        agentId,

        simulationTimeSeconds,

        eventType:
          "INITIAL_ROUTE",

        strategyId:
          null,

        trigger:
          null,

        reasonCodes:
          freezeReasons([
            "INITIAL_ROUTE",
            "NO_FEASIBLE_ALTERNATIVE",
          ]),

        action:
          "NO_FEASIBLE_ALTERNATIVE",

        currentTargetExitId:
          null,

        candidateTargetExitId:
          null,

        selectedTargetExitId:
          null,

        threshold:
          null,

        relativeImprovement:
          null,

        currentPredictedRiskExposureSeconds:
          null,

        candidatePredictedRiskExposureSeconds:
          null,

        currentEstimatedTravelTimeSeconds:
          null,

        candidateEstimatedTravelTimeSeconds:
          null,

        currentEdgeIds:
          freezeStrings([]),

        candidateEdgeIds:
          freezeStrings([]),

        routeChanged:
          false,
      });
    }

    const reasons:
      DecisionTraceReasonCode[] = [
        "INITIAL_ROUTE",
      ];

    if (
      decision.strategyId ===
      "NEAREST_EXIT"
    ) {
      reasons.push(
        "NEAREST_EXIT",
      );
    }

    if (
      decision.strategyId ===
      "STATIC_SHORTEST_PATH"
    ) {
      reasons.push(
        "STATIC_SHORTEST",
      );
    }

    return this.append({
      agentId,

      simulationTimeSeconds,

      eventType:
        "INITIAL_ROUTE",

      strategyId:
        decision.strategyId,

      trigger:
        null,

      reasonCodes:
        freezeReasons(
          reasons,
        ),

      action:
        "ROUTE_ASSIGNED",

      currentTargetExitId:
        null,

      candidateTargetExitId:
        decision.targetExitId,

      selectedTargetExitId:
        decision.targetExitId,

      threshold:
        null,

      relativeImprovement:
        null,

      currentPredictedRiskExposureSeconds:
        null,

      candidatePredictedRiskExposureSeconds:
        decision.metrics
          .predictedRiskExposureSeconds ??
        null,

      currentEstimatedTravelTimeSeconds:
        null,

      candidateEstimatedTravelTimeSeconds:
        decision.metrics
          .estimatedTravelTimeSeconds ??
        null,

      currentEdgeIds:
        freezeStrings([]),

      candidateEdgeIds:
        freezeStrings(
          decision.path.edgeIds,
        ),

      routeChanged:
        true,
    });
  }

  /**
   * Records the output of decideAdaptiveRerouting().
   *
   * The supplied result is used directly. No routing decision is
   * recalculated inside the logging layer.
   */
  public recordReroutingDecision(
    agentId: string,
    simulationTimeSeconds: number,
    currentPath: RoutingPath,
    input: ReroutingDecisionInput,
    result: ReroutingDecisionResult,
  ): DecisionTraceEntry {
    validateAgentId(
      agentId,
    );

    validateSimulationTime(
      simulationTimeSeconds,
    );

    if (
      Math.abs(
        input.threshold -
          result.threshold,
      ) > 1e-12
    ) {
      throw new Error(
        "Rerouting input and result thresholds must match.",
      );
    }

    const candidate =
      input.candidate;

    const selectedTargetExitId =
      selectedExitAfterDecision(
        currentPath,
        candidate,
        result,
      );

    return this.append({
      agentId,

      simulationTimeSeconds,

      eventType:
        "REROUTE_REVIEW",

      strategyId:
        candidate?.strategyId ??
        null,

      trigger:
        input.trigger,

      reasonCodes:
        createReroutingReasonCodes(
          input,
          result,
        ),

      action:
        result.action,

      currentTargetExitId:
        currentPath.targetNodeId,

      candidateTargetExitId:
        candidate?.targetExitId ??
        null,

      selectedTargetExitId,

      threshold:
        result.threshold,

      relativeImprovement:
        result.relativeImprovement,

      currentPredictedRiskExposureSeconds:
        result.current
          .predictedRiskExposureSeconds,

      candidatePredictedRiskExposureSeconds:
        result.candidate
          ?.predictedRiskExposureSeconds ??
        null,

      currentEstimatedTravelTimeSeconds:
        result.current
          .estimatedTravelTimeSeconds,

      candidateEstimatedTravelTimeSeconds:
        result.candidate
          ?.estimatedTravelTimeSeconds ??
        null,

      currentEdgeIds:
        freezeStrings(
          currentPath.edgeIds,
        ),

      candidateEdgeIds:
        freezeStrings(
          candidate?.path.edgeIds ??
            [],
        ),

      routeChanged:
        result.action ===
        "REROUTE",
    });
  }

  public getEntries():
    readonly DecisionTraceEntry[] {
    return Object.freeze([
      ...this.entries,
    ]);
  }

  public getEntriesForAgent(
    agentId: string,
  ): readonly DecisionTraceEntry[] {
    validateAgentId(
      agentId,
    );

    return Object.freeze(
      this.entries.filter(
        (entry) =>
          entry.agentId ===
          agentId,
      ),
    );
  }

  public get size(): number {
    return this.entries.length;
  }

  public clear(): void {
    this.entries.length = 0;
    this.nextSequence = 1;
  }
}