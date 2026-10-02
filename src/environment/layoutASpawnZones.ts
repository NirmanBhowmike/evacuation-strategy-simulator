import type { Polygon2D } from "../types/environment";
import type {
  SpawnZone,
  SpawnZoneSet,
} from "../types/spawn";

function rectangle(
  x: number,
  y: number,
  width: number,
  height: number,
): Polygon2D {
  return {
    vertices: [
      { x, y },
      { x: x + width, y },
      {
        x: x + width,
        y: y + height,
      },
      { x, y: y + height },
    ],
  };
}

function spawnZone(
  id: string,
  roomZoneId: string,
  accessNodeId: string,
  x: number,
  y: number,
  width: number,
  height: number,
): SpawnZone {
  return {
    id,
    roomZoneId,
    accessNodeId,
    polygon: rectangle(
      x,
      y,
      width,
      height,
    ),
  };
}

/**
 * Layout A baseline spawn zones.
 *
 * These zones distribute the starting population across the
 * western, central, eastern, and southeastern portions of the
 * fictional building.
 *
 * Spawn regions are smaller than their associated rooms so that
 * occupants are not initialized directly against room boundaries.
 */
export const layoutASpawnZones: SpawnZoneSet = {
  layoutId: "layout-a",

  zones: [
    // ============================================================
    // WEST / NORTHWEST
    // ============================================================

    spawnZone(
      "spawn-west-north",
      "room-west-04",
      "northwest-decision",
      5,
      28,
      2,
      2,
    ),

    spawnZone(
      "spawn-west-south",
      "room-west-05",
      "west-junction",
      5,
      22,
      2,
      2,
    ),

    // ============================================================
    // WEST-CENTRAL
    // ============================================================

    spawnZone(
      "spawn-west-central-01",
      "room-west-central-01",
      "main-west",
      12,
      15,
      2,
      2,
    ),

    spawnZone(
      "spawn-west-central-02",
      "room-west-central-02",
      "main-west",
      21,
      15,
      2,
      2,
    ),

    spawnZone(
      "spawn-west-central-04",
      "room-west-central-04",
      "west-atrium-decision",
      26,
      22,
      2,
      2,
    ),

    // ============================================================
    // CENTRAL CLUSTER
    // ============================================================

    spawnZone(
      "spawn-central-01",
      "room-central-01",
      "central-lower",
      39.5,
      22,
      2,
      2,
    ),

    spawnZone(
      "spawn-central-02",
      "room-central-02",
      "main-mid",
      44.5,
      22,
      2,
      2,
    ),

    spawnZone(
      "spawn-central-05",
      "room-central-05",
      "main-mid",
      49.5,
      22,
      2,
      2,
    ),

    // ============================================================
    // EASTERN WING
    // ============================================================

    spawnZone(
      "spawn-east-large",
      "room-east-large-01",
      "upper-east",
      64,
      35,
      3,
      2,
    ),

    spawnZone(
      "spawn-east-01",
      "room-east-01",
      "east-lower",
      63,
      22,
      2,
      2,
    ),

    spawnZone(
      "spawn-east-02",
      "room-east-02",
      "far-east-main",
      70,
      22,
      2,
      2,
    ),

    // ============================================================
    // SOUTHEAST EXTENSION
    // ============================================================

    spawnZone(
      "spawn-southeast",
      "room-southeast-01",
      "southeast-mid",
      63,
      9,
      2,
      2,
    ),
  ],
};