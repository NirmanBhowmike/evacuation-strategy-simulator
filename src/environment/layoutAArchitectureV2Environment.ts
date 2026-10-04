import {
  layoutAArchitectureV2,
} from "./layoutAArchitectureV2";

import type {
  BuildingEnvironment,
  BuildingZone,
  ZoneType,
} from "../types/environment";

export const LAYOUT_A_ARCHITECTURE_V2_ID =
  "layout-a-architecture-v2";

function circulationZoneType(
  kind:
    "CORRIDOR" |
    "HALL" |
    "OPEN_AREA",
): ZoneType {
  if (
    kind ===
    "CORRIDOR"
  ) {
    return "CORRIDOR";
  }

  return "OPEN_AREA";
}

const roomZones:
  readonly BuildingZone[] =
  layoutAArchitectureV2
    .rooms
    .map(
      (
        room,
      ) => ({
        id:
          room.id,

        type:
          "ROOM",

        polygon: {
          vertices:
            room.polygon.map(
              (
                point,
              ) => ({
                x:
                  point.x,

                y:
                  point.y,
              }),
            ),
        },
      }),
    );

const circulationZones:
  readonly BuildingZone[] =
  layoutAArchitectureV2
    .circulation
    .map(
      (
        area,
      ) => ({
        id:
          area.id,

        type:
          circulationZoneType(
            area.kind,
          ),

        polygon: {
          vertices:
            area.polygon.map(
              (
                point,
              ) => ({
                x:
                  point.x,

                y:
                  point.y,
              }),
            ),
        },
      }),
    );

/**
 * Engine-facing BuildingEnvironment derived directly
 * from the approved Architecture V2 geometry.
 */
export const layoutAArchitectureV2Environment:
  BuildingEnvironment = {
  layoutId:
    LAYOUT_A_ARCHITECTURE_V2_ID,

  widthMeters:
    layoutAArchitectureV2
      .widthMeters,

  heightMeters:
    layoutAArchitectureV2
      .heightMeters,

  zones: [
    ...roomZones,
    ...circulationZones,
  ],
};