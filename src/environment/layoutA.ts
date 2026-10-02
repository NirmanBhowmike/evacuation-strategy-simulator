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
      {
        x:
          x + width,
        y,
      },
      {
        x:
          x + width,
        y:
          y + height,
      },
      {
        x,
        y:
          y + height,
      },
    ],
  };
}

function polygon(
  vertices:
    readonly {
      x: number;
      y: number;
    }[],
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
    polygon:
      rectangle(
        x,
        y,
        width,
        height,
      ),
  };
}

function polygonZone(
  id: string,
  type: ZoneType,
  vertices:
    readonly {
      x: number;
      y: number;
    }[],
): BuildingZone {
  return {
    id,
    type,
    polygon:
      polygon(
        vertices,
      ),
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
export const layoutA:
  BuildingEnvironment = {
  layoutId:
    "layout-a",

  widthMeters:
    82,

  heightMeters:
    50,

  zones: [
    // ============================================================
    // PRIMARY EAST-WEST CIRCULATION
    // ============================================================

    rectangularZone(
      "corridor-main-spine",
      "CORRIDOR",
      17,
      17,
      55,
      3.5,
    ),

    /**
     * Dedicated experimental sub-zone within the eastern portion
     * of the main corridor.
     *
     * Only edge-main-east-end is assigned to this zone.
     *
     * A CORRIDOR_BLOCK event can therefore disable that segment
     * without classifying the entire main corridor as blocked.
     *
     * The zone overlaps the parent physical corridor and should
     * later be visualized as an event/control overlay rather than
     * as a second physical floor surface.
     */
    rectangularZone(
      "corridor-main-east-blockable",
      "CORRIDOR",
      59.75,
      17,
      12.25,
      3.5,
    ),

    rectangularZone(
      "corridor-west-central",
      "CORRIDOR",
      8,
      23,
      23,
      3.5,
    ),

    polygonZone(
      "corridor-northwest-link",
      "CORRIDOR",
      [
        {
          x: 7,
          y: 32,
        },
        {
          x: 10,
          y: 32,
        },
        {
          x: 17,
          y: 27,
        },
        {
          x: 17,
          y: 23,
        },
        {
          x: 14,
          y: 23,
        },
        {
          x: 7,
          y: 29,
        },
      ],
    ),

    rectangularZone(
      "corridor-central-vertical",
      "CORRIDOR",
      35,
      20.5,
      3.5,
      14,
    ),

    rectangularZone(
      "corridor-east-vertical",
      "CORRIDOR",
      58,
      20.5,
      3.5,
      13,
    ),

    rectangularZone(
      "corridor-east-upper",
      "CORRIDOR",
      38.5,
      31,
      23,
      3.5,
    ),

    rectangularZone(
      "corridor-east-bottleneck",
      "CORRIDOR",
      38.5,
      29,
      19.5,
      2,
    ),

    rectangularZone(
      "corridor-southeast",
      "CORRIDOR",
      61.5,
      13,
      15,
      3.5,
    ),

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

    polygonZone(
      "open-west-atrium",
      "OPEN_AREA",
      [
        {
          x: 14,
          y: 20.5,
        },
        {
          x: 25,
          y: 20.5,
        },
        {
          x: 25,
          y: 29,
        },
        {
          x: 20,
          y: 31,
        },
        {
          x: 14,
          y: 28,
        },
      ],
    ),

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
        {
          x: 3,
          y: 38,
        },
        {
          x: 9,
          y: 42,
        },
        {
          x: 13,
          y: 38,
        },
        {
          x: 10,
          y: 34,
        },
        {
          x: 5,
          y: 34,
        },
      ],
    ),

    polygonZone(
      "room-west-02",
      "ROOM",
      [
        {
          x: 10,
          y: 43,
        },
        {
          x: 17,
          y: 46,
        },
        {
          x: 21,
          y: 42,
        },
        {
          x: 16,
          y: 37,
        },
        {
          x: 12,
          y: 38,
        },
      ],
    ),

    polygonZone(
      "room-west-03",
      "ROOM",
      [
        {
          x: 17,
          y: 36,
        },
        {
          x: 24,
          y: 39,
        },
        {
          x: 27,
          y: 35,
        },
        {
          x: 22,
          y: 31,
        },
        {
          x: 18,
          y: 32,
        },
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

    polygonZone(
      "room-far-east",
      "ROOM",
      [
        {
          x: 75.5,
          y: 16.5,
        },
        {
          x: 81,
          y: 18,
        },
        {
          x: 81,
          y: 27,
        },
        {
          x: 75.5,
          y: 28.5,
        },
      ],
    ),
  ],
};