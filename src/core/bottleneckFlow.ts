import type { NavigationEdge } from "../types/navigation";

/**
 * Baseline specific pedestrian flow used by the current
 * research model.
 *
 * Units:
 * persons / (meter * second)
 *
 * This remains configurable for later sensitivity analysis.
 */
export const DEFAULT_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND =
  1.3;

export interface BottleneckAdmissionResult {
  /**
   * Edge whose entry capacity was evaluated.
   */
  readonly edgeId: string;

  /**
   * Maximum nominal flow through the edge in persons/second.
   *
   * Q = q_s * W
   */
  readonly capacityPersonsPerSecond: number;

  /**
   * Agents permitted to enter during this timestep.
   *
   * Ordering follows the supplied candidate ordering.
   */
  readonly admittedAgentIds: readonly string[];

  /**
   * Agents that remain queued after this timestep.
   */
  readonly queuedAgentIds: readonly string[];

  /**
   * Fractional capacity retained for the next timestep while
   * demand remains queued.
   */
  readonly carryPersons: number;
}

/**
 * Width-based pedestrian flow controller.
 *
 * The controller converts specific flow and edge width into
 * discrete admission permits:
 *
 * Q = q_s * W
 *
 * capacity budget =
 * previous fractional carry + Q * deltaTime
 *
 * Only whole-person admissions are issued.
 *
 * Fractional capacity is retained only when a queue remains.
 * Unused service capacity is not banked when demand disappears.
 */
export class BottleneckFlowController {
  private readonly carryByEdge =
    new Map<string, number>();

  public constructor(
    private readonly specificFlowPersonsPerMeterSecond =
      DEFAULT_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ) {
    if (
      !Number.isFinite(
        specificFlowPersonsPerMeterSecond,
      ) ||
      specificFlowPersonsPerMeterSecond <= 0
    ) {
      throw new Error(
        "Specific flow must be positive and finite.",
      );
    }
  }

  public getSpecificFlowPersonsPerMeterSecond(): number {
    return this
      .specificFlowPersonsPerMeterSecond;
  }

  /**
   * Returns nominal edge capacity in persons/second.
   */
  public calculateCapacityPersonsPerSecond(
    edge: NavigationEdge,
  ): number {
    if (
      !Number.isFinite(
        edge.widthMeters,
      ) ||
      edge.widthMeters <= 0
    ) {
      throw new Error(
        `Edge ${edge.id} must have a positive finite width.`,
      );
    }

    return (
      this
        .specificFlowPersonsPerMeterSecond *
      edge.widthMeters
    );
  }

  /**
   * Evaluates which queued agents may enter an edge during
   * one simulation timestep.
   *
   * candidateAgentIds must already be ordered according to
   * the queue discipline selected by the simulation.
   */
  public admitAgents(
    edge: NavigationEdge,
    candidateAgentIds: readonly string[],
    deltaSeconds: number,
  ): BottleneckAdmissionResult {
    if (
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds <= 0
    ) {
      throw new Error(
        "Bottleneck timestep must be positive and finite.",
      );
    }

    const capacityPersonsPerSecond =
      this.calculateCapacityPersonsPerSecond(
        edge,
      );

    const uniqueAgentIds =
      new Set<string>();

    for (
      const agentId of
        candidateAgentIds
    ) {
      if (!agentId.trim()) {
        throw new Error(
          "Bottleneck candidate agent ids must be non-empty.",
        );
      }

      if (
        uniqueAgentIds.has(agentId)
      ) {
        throw new Error(
          `Duplicate bottleneck candidate agent id: ${agentId}`,
        );
      }

      uniqueAgentIds.add(agentId);
    }

    /**
     * If nobody is waiting, unused capacity disappears.
     * It must not accumulate and create a later artificial burst.
     */
    if (
      candidateAgentIds.length === 0
    ) {
      this.carryByEdge.delete(
        edge.id,
      );

      return {
        edgeId: edge.id,
        capacityPersonsPerSecond,
        admittedAgentIds: [],
        queuedAgentIds: [],
        carryPersons: 0,
      };
    }

    const previousCarry =
      this.carryByEdge.get(
        edge.id,
      ) ?? 0;

    const availablePersonBudget =
      previousCarry +
      capacityPersonsPerSecond *
        deltaSeconds;

    /**
     * Small tolerance reduces the chance that floating-point
     * representation turns an expected integer capacity into
     * something such as 0.9999999999999999.
     */
    const tolerance = 1e-12;

    const availableWholeAdmissions =
      Math.floor(
        availablePersonBudget +
          tolerance,
      );

    const admittedCount =
      Math.min(
        availableWholeAdmissions,
        candidateAgentIds.length,
      );

    const admittedAgentIds =
      candidateAgentIds.slice(
        0,
        admittedCount,
      );

    const queuedAgentIds =
      candidateAgentIds.slice(
        admittedCount,
      );

    let carryPersons = 0;

    if (
      queuedAgentIds.length > 0
    ) {
      carryPersons =
        availablePersonBudget -
        admittedCount;

      if (
        Math.abs(carryPersons) <
        tolerance
      ) {
        carryPersons = 0;
      }

      carryPersons =
        Math.max(
          0,
          carryPersons,
        );

      this.carryByEdge.set(
        edge.id,
        carryPersons,
      );
    } else {
      /**
       * Demand has been completely served.
       *
       * Remaining service capacity is discarded rather than
       * banked for future arrivals.
       */
      this.carryByEdge.delete(
        edge.id,
      );

      carryPersons = 0;
    }

    return {
      edgeId: edge.id,
      capacityPersonsPerSecond,
      admittedAgentIds,
      queuedAgentIds,
      carryPersons,
    };
  }

  /**
   * Clears accumulated fractional capacity.
   *
   * Supplying an edge id resets only that edge.
   * Omitting the id resets the complete controller.
   */
  public reset(
    edgeId?: string,
  ): void {
    if (
      edgeId === undefined
    ) {
      this.carryByEdge.clear();
      return;
    }

    this.carryByEdge.delete(
      edgeId,
    );
  }

  /**
   * Exposed primarily for deterministic testing and experiment
   * diagnostics.
   */
  public getCarryPersons(
    edgeId: string,
  ): number {
    return (
      this.carryByEdge.get(
        edgeId,
      ) ?? 0
    );
  }
}