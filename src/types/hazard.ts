import type { ZoneId } from "./environment";

export type HazardState =
  | "CLEAR"
  | "RISK"
  | "BLOCKED";

export interface HazardZoneState {
  /**
   * Building zone affected by the hazard state.
   */
  readonly zoneId: ZoneId;

  /**
   * Current hazard classification.
   */
  readonly state: HazardState;
}

export interface HazardFieldSnapshot {
  /**
   * Building layout associated with this hazard field.
   */
  readonly layoutId: string;

  /**
   * Hazard state for every building zone.
   */
  readonly zones: readonly HazardZoneState[];
}