import type { AgentState } from "./agent";
import type { DecisionTraceEntry } from "./decisionTrace";
import type { SimulationMetrics } from "./metrics";
import type { RouteStabilitySummary } from "./routeStability";
import type { RoutingStrategyId } from "./routingStrategy";
import type { SimulationTerminationStatus } from "./termination";

export interface HeadlessSimulationConfiguration {
  readonly strategyId:
    RoutingStrategyId;

  readonly timestepSeconds?:
    number;

  readonly maximumSimulationTimeSeconds?:
    number;

  readonly densityCellLengthMeters?:
    number;

  /**
   * Used by Adaptive Hybrid only.
   *
   * Baseline default:
   * 0.20
   */
  readonly adaptiveRerouteThreshold?:
    number;

  /**
   * Specific pedestrian flow:
   *
   * persons / (meter * second)
   *
   * If omitted, BottleneckFlowController uses its current
   * baseline default.
   */
  readonly specificFlowPersonsPerMeterSecond?:
    number;
}

export interface HeadlessQueueMetrics {
  /**
   * Sum of individual queue waiting times.
   *
   * Units:
   * person-seconds.
   */
  readonly populationQueueWaitPersonSeconds:
    number;

  readonly meanQueueWaitSeconds:
    number;

  readonly maximumQueueWaitSeconds:
    number;
}

export interface AppliedDisruptionRecord {
  readonly id: string;

  readonly type:
    | "HAZARD_ACTIVATE"
    | "HAZARD_EXPAND"
    | "CORRIDOR_BLOCK"
    | "EXIT_BLOCK";

  readonly activationTimeSeconds:
    number;

  readonly targetId:
    string;
}

export interface HeadlessSimulationResult {
  readonly scenarioId:
    string;

  readonly parameterSetId:
    string;

  readonly seed:
    number;

  readonly layoutId:
    string;

  readonly strategyId:
    RoutingStrategyId;

  readonly timestepSeconds:
    number;

  readonly simulatedTimeSeconds:
    number;

  readonly ticks:
    number;

  readonly termination:
    SimulationTerminationStatus;

  readonly metrics:
    SimulationMetrics;

  readonly queueMetrics:
    HeadlessQueueMetrics;

  readonly appliedDisruptions:
    readonly AppliedDisruptionRecord[];

  readonly decisionTrace:
    readonly DecisionTraceEntry[];

  readonly routeStability:
    RouteStabilitySummary;

  readonly finalAgents:
    readonly AgentState[];
}