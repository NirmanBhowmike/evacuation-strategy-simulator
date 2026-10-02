import type { DensitySnapshot } from "./density";
import type { ZoneId } from "./environment";
import type {
  ExitId,
  ExitSet,
} from "./exit";
import type { HazardState } from "./hazard";
import type {
  NavigationGraph,
  NavigationNodeId,
} from "./navigation";
import type { RoutingPath } from "./routing";

export type RoutingStrategyId =
  | "NEAREST_EXIT"
  | "STATIC_SHORTEST_PATH"
  | "CONGESTION_AWARE"
  | "HAZARD_AWARE"
  | "ADAPTIVE_HYBRID";

export interface RoutingHazardZoneState {
  readonly zoneId: ZoneId;

  readonly state: HazardState;
}

export type RoutingQueueDelayByEdge =
  Readonly<Record<string, number>>;

/**
 * Current dynamic information that a routing strategy is
 * permitted to observe.
 *
 * Deliberately excluded:
 *
 * - future disruption schedule
 * - future hazard states
 * - future congestion
 * - future exit closures
 * - scenario random-number generator
 *
 * This prevents routing strategies from receiving future or
 * oracle information.
 */
export interface RoutingCurrentState {
  /**
   * Current hazard classification of every building zone.
   */
  readonly hazardZones:
    readonly RoutingHazardZoneState[];

  /**
   * Exits that have already become unavailable.
   */
  readonly blockedExitIds:
    readonly ExitId[];

  /**
   * Current measured or calculated density state.
   */
  readonly densitySnapshot:
    DensitySnapshot;

  /**
   * Current estimated queue delay associated with navigation
   * edges.
   */
  readonly queueDelayByEdge:
    RoutingQueueDelayByEdge;
}

/**
 * Standardized input supplied to every routing strategy.
 *
 * All strategies receive the same categories of information.
 * Individual strategies may choose not to use some fields.
 */
export interface RoutingStrategyContext {
  readonly layoutId: string;

  readonly startNodeId:
    NavigationNodeId;

  readonly graph:
    NavigationGraph;

  readonly exits:
    ExitSet;

  /**
   * Only current observable dynamic state is exposed here.
   */
  readonly current:
    RoutingCurrentState;
}

/**
 * Strategy-specific diagnostic quantities generated during a
 * routing decision.
 *
 * Not every metric applies to every strategy.
 */
export interface RoutingDecisionMetrics {
  /**
   * Used by Nearest Exit.
   */
  readonly straightLineDistanceMeters?:
    number;

  /**
   * Used by Static Shortest Path.
   */
  readonly networkDistanceMeters?:
    number;

  /**
   * Used by congestion-aware, hazard-aware, and adaptive
   * strategies.
   */
  readonly estimatedTravelTimeSeconds?:
    number;

  /**
   * Used by hazard-aware and adaptive strategies.
   */
  readonly predictedRiskExposureSeconds?:
    number;
}

/**
 * Common output returned by all routing strategies.
 */
export interface RoutingStrategyDecision {
  readonly strategyId:
    RoutingStrategyId;

  readonly targetExitId:
    ExitId;

  readonly path:
    RoutingPath;

  readonly metrics:
    RoutingDecisionMetrics;
}

/**
 * Common routing-strategy contract.
 *
 * Every routing policy will expose the same route() interface so
 * the simulation engine can switch strategies without containing
 * strategy-specific control logic.
 */
export interface RoutingStrategy {
  readonly id:
    RoutingStrategyId;

  route(
    context: RoutingStrategyContext,
  ): RoutingStrategyDecision | null;
}