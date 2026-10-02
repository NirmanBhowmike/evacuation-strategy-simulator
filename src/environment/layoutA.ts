import type {
  BuildingEnvironment,
  BuildingZone,
  Polygon2D,
  ZoneType,
} from "../types/environment";

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
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
  };
}

function polygon(
  vertices: readonly { x: number; y: number }[],
): Polygon2D {
  return {
    vertices,
  };
}

function rectangularZone(
  id: string,
  type: ZoneType,
  x: number,
  y: number,
  width: number,
  height: number,
): BuildingZone {
  return {
    id,
    type,
    polygon: rectangle(x, y, width, height),
  };
}

function polygonZone(
  id: string,
  type: ZoneType,
  vertices: readonly { x: number; y: number }[],
): BuildingZone {
  return {
    id,
    type,
    polygon: polygon(vertices),
  };
}

/**
 * Layout A
 *
 * Fictional institutional building used for development,
 * calibration, routing experiments, and later 3D visualization.
 *
 * The broad spatial organization is inspired by the reference
 * floor-plan image supplied during project development.
 *
 * It is not an architectural reproduction of a real facility.
 * No real building name, room numbers, labels, logos, or exact
 * dimensions are used.
 */
export const layoutA: BuildingEnvironment = {
  layoutId: "layout-a",

  // All coordinates are expressed in meters.
  widthMeters: 82,
  heightMeters: 50,

  zones: [
    // ============================================================
    // PRIMARY EAST-WEST CIRCULATION
    // ============================================================

    /**
     * Dominant east-west circulation spine.
     */
    rectangularZone(
      "corridor-main-spine",
      "CORRIDOR",
      17,
      17,
      55,
      3.5,
    ),

    /**
     * West-central corridor serving the western wing and atrium.
     */
    rectangularZone(
      "corridor-west-central",
      "CORRIDOR",
      8,
      23,
      23,
      3.5,
    ),

    /**
     * Angled northwest connector.
     */
    polygonZone(
      "corridor-northwest-link",
      "CORRIDOR",
      [
        { x: 7, y: 32 },
        { x: 10, y: 32 },
        { x: 17, y: 27 },
        { x: 17, y: 23 },
        { x: 14, y: 23 },
        { x: 7, y: 29 },
      ],
    ),

    /**
     * Central north-south route.
     */
    rectangularZone(
      "corridor-central-vertical",
      "CORRIDOR",
      35,
      20.5,
      3.5,
      14,
    ),

    /**
     * Eastern vertical circulation route.
     */
    rectangularZone(
      "corridor-east-vertical",
      "CORRIDOR",
      58,
      20.5,
      3.5,
      13,
    ),

    /**
     * Wider upper east-west alternative route.
     */
    rectangularZone(
      "corridor-east-upper",
      "CORRIDOR",
      38.5,
      31,
      23,
      3.5,
    ),

    /**
     * Deliberately narrow connector.
     *
     * This provides a shorter but lower-capacity alternative
     * between the central and eastern portions of the building.
     */
    rectangularZone(
      "corridor-east-bottleneck",
      "CORRIDOR",
      38.5,
      29,
      19.5,
      2,
    ),

    /**
     * Southeast circulation extension.
     */
    rectangularZone(
      "corridor-southeast",
      "CORRIDOR",
      61.5,
      13,
      15,
      3.5,
    ),

    /**
     * Far-east terminal corridor.
     */
    rectangularZone(
      "corridor-far-east",
      "CORRIDOR",
      72,
      16.5,
      3.5,
      12,
    ),

    // ============================================================
    // OPEN / ATRIUM-LIKE AREAS
    // ============================================================

    /**
     * Irregular west-central open area.
     */
    polygonZone(
      "open-west-atrium",
      "OPEN_AREA",
      [
        { x: 14, y: 20.5 },
        { x: 25, y: 20.5 },
        { x: 25, y: 29 },
        { x: 20, y: 31 },
        { x: 14, y: 28 },
      ],
    ),

    /**
     * Central collaboration and circulation area.
     */
    rectangularZone(
      "open-central",
      "OPEN_AREA",
      27,
      26.5,
      8,
      7.5,
    ),

    // ============================================================
    // NORTHWEST IRREGULAR WING
    // ============================================================

    polygonZone(
      "room-west-01",
      "ROOM",
      [
        { x: 3, y: 38 },
        { x: 9, y: 42 },
        { x: 13, y: 38 },
        { x: 10, y: 34 },
        { x: 5, y: 34 },
      ],
    ),

    polygonZone(
      "room-west-02",
      "ROOM",
      [
        { x: 10, y: 43 },
        { x: 17, y: 46 },
        { x: 21, y: 42 },
        { x: 16, y: 37 },
        { x: 12, y: 38 },
      ],
    ),

    polygonZone(
      "room-west-03",
      "ROOM",
      [
        { x: 17, y: 36 },
        { x: 24, y: 39 },
        { x: 27, y: 35 },
        { x: 22, y: 31 },
        { x: 18, y: 32 },
      ],
    ),

    rectangularZone(
      "room-west-04",
      "ROOM",
      4,
      27,
      7,
      5,
    ),

    rectangularZone(
      "room-west-05",
      "ROOM",
      4,
      20,
      7,
      6,
    ),

    // ============================================================
    // WEST-CENTRAL ROOM GROUP
    // ============================================================

    rectangularZone(
      "room-west-central-01",
      "ROOM",
      11,
      14,
      8,
      6,
    ),

    rectangularZone(
      "room-west-central-02",
      "ROOM",
      19,
      14,
      7,
      6,
    ),

    rectangularZone(
      "room-west-central-03",
      "ROOM",
      8,
      26.5,
      6,
      5.5,
    ),

    rectangularZone(
      "room-west-central-04",
      "ROOM",
      25,
      20.5,
      7,
      6,
    ),

    // ============================================================
    // CENTRAL ROOM CLUSTER
    // ============================================================

    rectangularZone(
      "room-central-01",
      "ROOM",
      38.5,
      20.5,
      5,
      5.5,
    ),

    rectangularZone(
      "room-central-02",
      "ROOM",
      43.5,
      20.5,
      5,
      5.5,
    ),

    /**
     * These two rooms were shortened so the narrow connector
     * physically passes between the central and eastern areas.
     */
    rectangularZone(
      "room-central-03",
      "ROOM",
      38.5,
      26,
      5,
      3,
    ),

    rectangularZone(
      "room-central-04",
      "ROOM",
      43.5,
      26,
      5,
      3,
    ),

    rectangularZone(
      "room-central-05",
      "ROOM",
      48.5,
      20.5,
      5,
      5.5,
    ),

    // ============================================================
    // EASTERN WING
    // ============================================================

    /**
     * Large eastern room/laboratory block.
     */
    rectangularZone(
      "room-east-large-01",
      "ROOM",
      61.5,
      28,
      14,
      10,
    ),

    rectangularZone(
      "room-east-01",
      "ROOM",
      61.5,
      20.5,
      7,
      7.5,
    ),

    rectangularZone(
      "room-east-02",
      "ROOM",
      68.5,
      20.5,
      7,
      7.5,
    ),

    // ============================================================
    // SOUTHEAST EXTENSION
    // ============================================================

    rectangularZone(
      "room-southeast-01",
      "ROOM",
      61.5,
      7,
      7,
      6,
    ),

    rectangularZone(
      "room-southeast-02",
      "ROOM",
      68.5,
      7,
      7,
      6,
    ),

    /**
     * Irregular terminal room mass on the far east side.
     */
    polygonZone(
      "room-far-east",
      "ROOM",
      [
        { x: 75.5, y: 16.5 },
        { x: 81, y: 18 },
        { x: 81, y: 27 },
        { x: 75.5, y: 28.5 },
      ],
    ),
  ],
};