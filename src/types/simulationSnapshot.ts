import type { AgentStatus } from "./agent";
import type { HazardState } from "./hazard";
import type { Position2D } from "./scenario";

export interface SimulationAgentSnapshot {
  readonly id: string;

  readonly position: Position2D;

  readonly status: AgentStatus;

  readonly desiredSpeedMps: number;

  readonly currentNodeId: string | null;

  readonly currentEdgeId: string | null;

  readonly targetExitId: string | null;

  readonly rerouteCount: number;

  readonly distanceTraveledMeters: number;

  readonly hazardExposureSeconds: number;

  readonly evacuationTimeSeconds: number | null;
}

export interface SimulationHazardZoneSnapshot {
  readonly zoneId: string;

  readonly state: HazardState;
}

export interface SimulationSnapshot {
  /**
   * Layout represented by this simulation state.
   */
  readonly layoutId: string;

  /**
   * Current simulation time.
   */
  readonly simulationTimeSeconds: number;

  /**
   * Current runtime state of every simulated occupant.
   *
   * This data is copied from the engine so a renderer cannot
   * accidentally mutate simulation state.
   */
  readonly agents:
    readonly SimulationAgentSnapshot[];

  /**
   * Current hazard state of the building.
   */
  readonly hazardZones:
    readonly SimulationHazardZoneSnapshot[];

  /**
   * Dynamically blocked exits.
   */
  readonly blockedExitIds:
    readonly string[];
}