export interface ExitUtilizationMetric {
  readonly exitId: string;
  readonly evacuatedAgents: number;
  readonly fractionOfEvacuatedAgents: number;
}

export interface SimulationMetrics {
  readonly totalAgents: number;

  readonly evacuatedAgents: number;
  readonly unreachableAgents: number;
  readonly timeoutAgents: number;
  readonly activeAgents: number;

  /**
   * Fraction of the complete population that successfully evacuated.
   */
  readonly completionRate: number;

  /**
   * Conventional total evacuation time.
   *
   * This is reported only when every occupant successfully evacuates.
   * If any occupant is ACTIVE, UNREACHABLE, or TIMEOUT, the value is null.
   */
  readonly totalEvacuationTimeSeconds: number | null;

  /**
   * Latest recorded evacuation time among successfully evacuated agents.
   *
   * This remains available even when the complete population did not
   * successfully evacuate.
   */
  readonly latestEvacuationTimeSeconds: number | null;

  readonly meanEvacuationTimeSeconds: number | null;

  /**
   * Nearest-rank 95th percentile among successfully evacuated occupants.
   */
  readonly p95EvacuationTimeSeconds: number | null;

  /**
   * Sum of individual hazard-exposure durations.
   *
   * Units: person-seconds.
   */
  readonly populationHazardExposurePersonSeconds: number;

  readonly meanHazardExposureSeconds: number;

  readonly meanTravelDistanceMeters: number;

  readonly totalReroutes: number;

  readonly meanReroutesPerAgent: number;

  /**
   * Fraction of occupants whose rerouteCount is greater than zero.
   */
  readonly fractionRerouted: number;

  /**
   * Maximum density observed across all supplied density snapshots.
   *
   * Null means no density snapshots were supplied.
   */
  readonly maximumLocalDensityPersonsPerSquareMeter: number | null;

  readonly exitUtilization: readonly ExitUtilizationMetric[];
}