import type {
  AppliedDisruptionRecord,
} from "./headlessSimulation";

import type {
  SimulationSnapshot,
} from "./simulationSnapshot";

export interface SimulationReplayRoute {
  readonly agentId:
    string;

  readonly targetExitId:
    string | null;

  readonly routeCursorIndex:
    number;

  readonly nodeIds:
    readonly string[];

  readonly edgeIds:
    readonly string[];
}

export interface SimulationReplayMetrics {
  readonly totalAgents:
    number;

  readonly activeAgents:
    number;

  readonly evacuatedAgents:
    number;

  readonly unreachableAgents:
    number;

  readonly timeoutAgents:
    number;

  /**
   * Accumulated population hazard exposure at this frame.
   *
   * Unit:
   * person-seconds
   */
  readonly populationHazardExposurePersonSeconds:
    number;

  /**
   * Accumulated population queue waiting at this frame.
   *
   * Unit:
   * person-seconds
   */
  readonly populationQueueWaitPersonSeconds:
    number;

  readonly totalReroutes:
    number;
}

export interface SimulationReplayFrame {
  /**
   * Existing validated renderer-facing engine snapshot.
   */
  readonly snapshot:
    SimulationSnapshot;

  /**
   * Fixed-step engine tick associated with this frame.
   */
  readonly tick:
    number;

  /**
   * Current authoritative routes.
   */
  readonly routes:
    readonly SimulationReplayRoute[];

  /**
   * Events applied at or before this frame.
   */
  readonly appliedDisruptions:
    readonly AppliedDisruptionRecord[];

  /**
   * Events that activated exactly at this frame.
   *
   * Presentation mode can use these to trigger a brief hold.
   */
  readonly triggeredDisruptions:
    readonly AppliedDisruptionRecord[];

  readonly metrics:
    SimulationReplayMetrics;

  /**
   * True only for the final replay frame.
   */
  readonly isTerminal:
    boolean;
}