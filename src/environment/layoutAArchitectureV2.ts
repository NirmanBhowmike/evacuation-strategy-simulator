export interface ArchitecturePoint {
  readonly x: number;
  readonly y: number;
}

export interface ArchitectureDoor {
  readonly id: string;

  /**
   * Zero-based polygon-edge index.
   */
  readonly edgeIndex: number;

  /**
   * Position of the center of the door along the selected edge.
   *
   * 0 = edge start
   * 1 = edge end
   */
  readonly centerT: number;

  readonly widthMeters: number;
}

export interface ArchitectureRoom {
  readonly id: string;
  readonly label: string;
  readonly polygon: readonly ArchitecturePoint[];
  readonly doors: readonly ArchitectureDoor[];
}

export type CirculationKind =
  | "CORRIDOR"
  | "HALL"
  | "OPEN_AREA";

export interface ArchitectureCirculationArea {
  readonly id: string;
  readonly kind: CirculationKind;
  readonly polygon: readonly ArchitecturePoint[];
}

export interface ArchitectureExit {
  readonly id: string;
  readonly label: string;
  readonly position: ArchitecturePoint;
  readonly orientation:
    | "HORIZONTAL"
    | "VERTICAL";
  readonly widthMeters: number;
}

export interface LayoutAArchitectureV2 {
  readonly widthMeters: number;
  readonly heightMeters: number;
  readonly rooms:
    readonly ArchitectureRoom[];
  readonly circulation:
    readonly ArchitectureCirculationArea[];
  readonly exits:
    readonly ArchitectureExit[];
}

function rectangle(
  x: number,
  y: number,
  width: number,
  height: number,
): readonly ArchitecturePoint[] {
  return [
    {
      x,
      y,
    },

    {
      x:
        x +
        width,
      y,
    },

    {
      x:
        x +
        width,
      y:
        y +
        height,
    },

    {
      x,
      y:
        y +
        height,
    },
  ];
}

function room(
  id: string,
  label: string,
  polygon:
    readonly ArchitecturePoint[],
  doors:
    readonly ArchitectureDoor[],
): ArchitectureRoom {
  return {
    id,
    label,
    polygon,
    doors,
  };
}

function rectangularRoom(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  doors:
    readonly ArchitectureDoor[],
): ArchitectureRoom {
  return room(
    id,
    label,
    rectangle(
      x,
      y,
      width,
      height,
    ),
    doors,
  );
}

function circulation(
  id: string,
  kind: CirculationKind,
  polygon:
    readonly ArchitecturePoint[],
): ArchitectureCirculationArea {
  return {
    id,
    kind,
    polygon,
  };
}

function rectangularCirculation(
  id: string,
  kind: CirculationKind,
  x: number,
  y: number,
  width: number,
  height: number,
): ArchitectureCirculationArea {
  return circulation(
    id,
    kind,
    rectangle(
      x,
      y,
      width,
      height,
    ),
  );
}

function door(
  id: string,
  edgeIndex: number,
  centerT: number,
  widthMeters = 1.35,
): ArchitectureDoor {
  return {
    id,
    edgeIndex,
    centerT,
    widthMeters,
  };
}

/**
 * Symmetrical faceted polygon used by all three
 * northwest rooms.
 *
 * Adjacent copies share their short vertical side exactly.
 * The lower horizontal edge faces the shared hall and
 * contains the room door.
 */
function createNorthwestPolygon(
  leftX: number,
  bottomY: number,
): readonly ArchitecturePoint[] {
  const width =
    7;

  const height =
    8;

  const chamferX =
    2.05;

  const chamferY =
    2.0;

  const rightX =
    leftX +
    width;

  const topY =
    bottomY +
    height;

  return [
    // bottom-left facet
    {
      x:
        leftX +
        chamferX,
      y:
        bottomY,
    },

    // bottom-right facet
    {
      x:
        rightX -
        chamferX,
      y:
        bottomY,
    },

    // lower-right diagonal
    {
      x:
        rightX,
      y:
        bottomY +
        chamferY,
    },

    // upper-right vertical
    {
      x:
        rightX,
      y:
        topY -
        chamferY,
    },

    // upper-right diagonal
    {
      x:
        rightX -
        chamferX,
      y:
        topY,
    },

    // upper-left facet
    {
      x:
        leftX +
        chamferX,
      y:
        topY,
    },

    // upper-left diagonal
    {
      x:
        leftX,
      y:
        topY -
        chamferY,
    },

    // lower-left vertical
    {
      x:
        leftX,
      y:
        bottomY +
        chamferY,
    },
  ];
}

/**
 * Layout A Architecture V2
 *
 * Architecture-only development model.
 *
 * Navigation and simulation logic will be derived only after
 * the physical architecture has been accepted.
 */
export const layoutAArchitectureV2:
  LayoutAArchitectureV2 = {
  widthMeters:
    82,

  heightMeters:
    50,

  rooms: [
    // ==========================================================
    // NORTHWEST POLYGON WING
    //
    // Three identical faceted polygon rooms.
    //
    // Each room:
    // - has exactly the same dimensions;
    // - shares a vertical architectural boundary with
    //   its neighbor;
    // - has its own centered door into the shared hall.
    // ==========================================================

    room(
      "room-nw-01",
      "NW Room 01",
      createNorthwestPolygon(
        2,
        36,
      ),
      [
        door(
          "door-nw-01",
          0,
          0.5,
        ),
      ],
    ),

    room(
      "room-nw-02",
      "NW Room 02",
      createNorthwestPolygon(
        9,
        36,
      ),
      [
        door(
          "door-nw-02",
          0,
          0.5,
        ),
      ],
    ),

    room(
      "room-nw-03",
      "NW Room 03",
      createNorthwestPolygon(
        16,
        36,
      ),
      [
        door(
          "door-nw-03",
          0,
          0.5,
        ),
      ],
    ),

    // ==========================================================
    // WESTERN ROOMS
    // ==========================================================

    rectangularRoom(
      "room-west-upper",
      "West Upper Room",
      8,
      26,
      6,
      6,
      [
        door(
          "door-west-upper",
          1,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-west-lower",
      "West Lower Room",
      4,
      16,
      8,
      6,
      [
        door(
          "door-west-lower",
          2,
          0.5,
        ),
      ],
    ),

    // ==========================================================
    // WEST-CENTRAL ROOMS
    // ==========================================================

    rectangularRoom(
      "room-west-central-01",
      "West Central 01",
      12,
      10,
      8,
      8,
      [
        door(
          "door-west-central-01",
          2,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-west-central-02",
      "West Central 02",
      20,
      10,
      8,
      8,
      [
        door(
          "door-west-central-02",
          2,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-west-central-03",
      "West Central 03",
      4,
      26,
      4,
      6,
      [
        door(
          "door-west-central-03",
          0,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-west-central-04",
      "West Central 04",
      24,
      22,
      8,
      7,
      [
        door(
          "door-west-central-04",
          0,
          0.5,
        ),
      ],
    ),

    // ==========================================================
    // CENTRAL ROOMS
    // ==========================================================

    rectangularRoom(
      "room-central-01",
      "Central 01",
      38,
      22,
      5,
      7,
      [
        door(
          "door-central-01",
          0,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-central-02",
      "Central 02",
      43,
      22,
      5,
      7,
      [
        door(
          "door-central-02",
          0,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-central-03",
      "Central 03",
      48,
      22,
      5,
      7,
      [
        door(
          "door-central-03",
          0,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-central-upper-01",
      "Central Upper 01",
      38,
      35,
      6,
      5,
      [
        door(
          "door-central-upper-01",
          0,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-central-upper-02",
      "Central Upper 02",
      44,
      35,
      6,
      5,
      [
        door(
          "door-central-upper-02",
          0,
          0.5,
        ),
      ],
    ),

    // ==========================================================
    // EASTERN ROOMS
    // ==========================================================

    rectangularRoom(
      "room-east-large",
      "East Large Room",
      52,
      35,
      10,
      9,
      [
        door(
          "door-east-large",
          0,
          0.5,
          1.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-east-01",
      "East Room 01",
      62,
      23,
      5,
      8,
      [
        door(
          "door-east-01",
          3,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-east-02",
      "East Room 02",
      67,
      22,
      5,
      8,
      [
        door(
          "door-east-02",
          0,
          0.5,
        ),
      ],
    ),

    rectangularRoom(
      "room-far-east",
      "Far East Room",
      76,
      22,
      6,
      8,
      [
        door(
          "door-far-east",
          0,
          0.5,
        ),
      ],
    ),

    // ==========================================================
    // SOUTHEAST ROOMS
    // ==========================================================

    rectangularRoom(
      "room-southeast-01",
      "Southeast 01",
      58,
      6,
      9.2,
      8,
      [
        door(
          "door-southeast-01",
          1,
          0.55,
        ),
      ],
    ),

    rectangularRoom(
      "room-southeast-02",
      "Southeast 02",
      70.8,
      6,
      9.2,
      8,
      [
        door(
          "door-southeast-02",
          3,
          0.45,
        ),
      ],
    ),
  ],

  circulation: [
    // ==========================================================
    // MAIN EAST-WEST SPINE
    // ==========================================================

    rectangularCirculation(
      "corridor-main-spine",
      "CORRIDOR",
      12,
      18,
      64,
      4,
    ),

    // ==========================================================
    // WEST / NORTHWEST
    // ==========================================================

    rectangularCirculation(
      "corridor-west",
      "CORRIDOR",
      4,
      22,
      14,
      4,
    ),

    rectangularCirculation(
      "corridor-northwest-connector",
      "CORRIDOR",
      14,
      26,
      4,
      6,
    ),

    /**
     * Extended far enough to sit beneath all three
     * northwest polygon rooms.
     */
    rectangularCirculation(
      "hall-northwest",
      "HALL",
      1,
      32,
      23,
      4,
    ),

    circulation(
      "open-west-atrium",
      "OPEN_AREA",
      [
        {
          x: 18,
          y: 22,
        },

        {
          x: 34,
          y: 22,
        },

        {
          x: 34,
          y: 31,
        },

        {
          x: 28,
          y: 31,
        },

        {
          x: 24,
          y: 29,
        },

        {
          x: 18,
          y: 29,
        },
      ],
    ),

    // ==========================================================
    // CENTRAL / UPPER ALTERNATIVE
    // ==========================================================

    rectangularCirculation(
      "corridor-central-vertical",
      "CORRIDOR",
      34.2,
      22,
      3.6,
      13,
    ),

    rectangularCirculation(
      "corridor-upper-east",
      "CORRIDOR",
      37.8,
      31,
      24.2,
      4,
    ),

    rectangularCirculation(
      "corridor-east-vertical",
      "CORRIDOR",
      58.4,
      22,
      3.6,
      13,
    ),

    // ==========================================================
    // EXTERIOR EGRESS APPROACHES
    // ==========================================================

    rectangularCirculation(
      "corridor-south-central-egress",
      "CORRIDOR",
      34.2,
      14,
      3.6,
      4,
    ),

    rectangularCirculation(
      "corridor-east-egress",
      "CORRIDOR",
      76,
      18,
      6,
      4,
    ),

    rectangularCirculation(
      "corridor-southeast-branch",
      "CORRIDOR",
      62,
      14,
      10.8,
      4,
    ),

    rectangularCirculation(
      "corridor-southeast-egress",
      "CORRIDOR",
      67.2,
      6,
      3.6,
      12,
    ),
  ],

  exits: [
    {
      id:
        "exit-west",

      label:
        "West Exit",

      position: {
        x: 4,
        y: 24,
      },

      orientation:
        "VERTICAL",

      widthMeters:
        1.8,
    },

    {
      id:
        "exit-south-central",

      label:
        "South Central Exit",

      position: {
        x: 36,
        y: 14,
      },

      orientation:
        "HORIZONTAL",

      widthMeters:
        1.8,
    },

    {
      id:
        "exit-east",

      label:
        "East Exit",

      position: {
        x: 82,
        y: 20,
      },

      orientation:
        "VERTICAL",

      widthMeters:
        1.8,
    },

    {
      id:
        "exit-southeast",

      label:
        "Southeast Exit",

      position: {
        x: 69,
        y: 6,
      },

      orientation:
        "HORIZONTAL",

      widthMeters:
        1.8,
    },
  ],
};