import type { Position2D } from "./scenario";
import type { ZoneId } from "./environment";

export type ExitId = string;

export interface ExitDefinition {
  readonly id: ExitId;

  /**
   * Position of the exit in the 2D simulation coordinate system.
   */
  readonly position: Position2D;

  /**
   * Usable opening width in meters.
   */
  readonly widthMeters: number;

  /**
   * Building zone that provides access to this exit.
   */
  readonly connectedZoneId: ZoneId;
}

export interface ExitSet {
  readonly layoutId: string;
  readonly exits: readonly ExitDefinition[];
}