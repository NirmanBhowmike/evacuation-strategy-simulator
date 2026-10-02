import type { Polygon2D, ZoneId } from "./environment";
import type { NavigationNodeId } from "./navigation";

export type SpawnZoneId = string;

export interface SpawnZone {
  /**
   * Unique identifier for this spawn zone.
   */
  readonly id: SpawnZoneId;

  /**
   * Room containing the spawn region.
   */
  readonly roomZoneId: ZoneId;

  /**
   * Navigation node used when occupants leave this room and
   * enter the tactical routing network.
   */
  readonly accessNodeId: NavigationNodeId;

  /**
   * Region inside the room where initial occupant positions
   * may later be sampled.
   */
  readonly polygon: Polygon2D;
}

export interface SpawnZoneSet {
  readonly layoutId: string;

  readonly zones: readonly SpawnZone[];
}