import type { Position2D } from "./scenario";

export type ZoneId = string;

export type ZoneType =
  | "ROOM"
  | "CORRIDOR"
  | "OPEN_AREA";

export interface Polygon2D {
  readonly vertices: readonly Position2D[];
}

export interface BuildingZone {
  readonly id: ZoneId;
  readonly type: ZoneType;
  readonly polygon: Polygon2D;
}

export interface BuildingEnvironment {
  readonly layoutId: string;

  /**
   * All engine geometry uses meters.
   */
  readonly widthMeters: number;
  readonly heightMeters: number;

  readonly zones: readonly BuildingZone[];
}