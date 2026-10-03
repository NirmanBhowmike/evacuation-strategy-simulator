import {
  useMemo,
} from "react";

import {
  Edges,
} from "@react-three/drei";

import * as THREE from "three";

import {
  layoutA,
} from "../environment/layoutA";

import type {
  BuildingZone,
} from "../types/environment";

import type {
  Position2D,
} from "../types/scenario";

interface WallSegment {
  readonly id:
    string;

  readonly start:
    Position2D;

  readonly end:
    Position2D;
}

interface WallEdge {
  readonly key:
    string;

  readonly start:
    Position2D;

  readonly end:
    Position2D;
}

interface OpeningInterval {
  readonly start:
    number;

  readonly end:
    number;
}

interface ArchitecturalExitPortal {
  readonly id:
    string;

  readonly position:
    Position2D;

  readonly widthMeters:
    number;

  readonly orientation:
    "VERTICAL" |
    "HORIZONTAL";
}

interface ArchitecturalEgressArea {
  readonly id:
    string;

  readonly vertices:
    readonly Position2D[];
}

const WALL_HEIGHT_METERS =
  1.65;

const WALL_THICKNESS_METERS =
  0.11;

const WALL_BASE_Y =
  0.72;

const MIN_WALL_SEGMENT_METERS =
  0.18;

const EPSILON =
  1e-6;

/**
 * These portals are renderer-facing architectural locations.
 *
 * They do not replace or move the research-model exit nodes.
 */
const ARCHITECTURAL_EXIT_PORTALS:
  readonly ArchitecturalExitPortal[] =
[
  {
    id:
      "exit-west",

    position: {
      x:
        4,

      y:
        24.75,
    },

    widthMeters:
      1.8,

    orientation:
      "VERTICAL",
  },

  {
    id:
      "exit-south-central",

    position: {
      x:
        36.75,

      y:
        15.5,
    },

    widthMeters:
      1.8,

    orientation:
      "HORIZONTAL",
  },

  {
    id:
      "exit-east",

    position: {
      x:
        81,

      y:
        19.1,
    },

    widthMeters:
      1.8,

    orientation:
      "VERTICAL",
  },

  {
    id:
      "exit-southeast",

    position: {
      x:
        68.5,

      y:
        7,
    },

    widthMeters:
      1.8,

    orientation:
      "HORIZONTAL",
  },
];

/**
 * Renderer-only egress passages connecting the frozen research
 * exit thresholds to visually believable exterior portals.
 */
const ARCHITECTURAL_EGRESS_AREAS:
  readonly ArchitecturalEgressArea[] =
[
  {
    id:
      "west-egress",

    vertices: [
      {
        x:
          4,

        y:
          23.85,
      },

      {
        x:
          11,

        y:
          23.85,
      },

      {
        x:
          11,

        y:
          25.65,
      },

      {
        x:
          4,

        y:
          25.65,
      },
    ],
  },

  {
    id:
      "south-central-egress",

    vertices: [
      {
        x:
          35.85,

        y:
          15.5,
      },

      {
        x:
          37.65,

        y:
          15.5,
      },

      {
        x:
          37.65,

        y:
          17,
      },

      {
        x:
          35.85,

        y:
          17,
      },
    ],
  },

  {
    id:
      "east-egress",

    vertices: [
      {
        x:
          75.5,

        y:
          17.35,
      },

      {
        x:
          81,

        y:
          18.2,
      },

      {
        x:
          81,

        y:
          20,
      },

      {
        x:
          75.5,

        y:
          19.15,
      },
    ],
  },

  {
    id:
      "southeast-egress",

    vertices: [
      {
        x:
          67.6,

        y:
          7,
      },

      {
        x:
          69.4,

        y:
          7,
      },

      {
        x:
          69.4,

        y:
          13,
      },

      {
        x:
          67.6,

        y:
          13,
      },
    ],
  },
];

function simulationXToWorldX(
  x:
    number,
): number {
  return (
    x -
    layoutA.widthMeters /
      2
  );
}

function simulationYToWorldZ(
  y:
    number,
): number {
  return (
    layoutA.heightMeters /
      2 -
    y
  );
}

function nearlyEqual(
  first:
    number,
  second:
    number,
): boolean {
  return (
    Math.abs(
      first -
      second,
    ) <=
    EPSILON
  );
}

function pointKey(
  point:
    Position2D,
): string {
  return (
    `${point.x.toFixed(
      4,
    )},` +
    `${point.y.toFixed(
      4,
    )}`
  );
}

function canonicalizeSegment(
  first:
    Position2D,
  second:
    Position2D,
): WallEdge {
  const firstKey =
    pointKey(
      first,
    );

  const secondKey =
    pointKey(
      second,
    );

  if (
    firstKey <=
    secondKey
  ) {
    return {
      key:
        `${firstKey}|${secondKey}`,

      start:
        first,

      end:
        second,
    };
  }

  return {
    key:
      `${secondKey}|${firstKey}`,

    start:
      second,

    end:
      first,
  };
}

function coordinateToInterval(
  edge:
    WallEdge,
  coordinate:
    number,
): number {
  const dx =
    edge.end.x -
    edge.start.x;

  const dy =
    edge.end.y -
    edge.start.y;

  if (
    Math.abs(dx) >=
    Math.abs(dy)
  ) {
    if (
      Math.abs(dx) <
      EPSILON
    ) {
      return 0;
    }

    return (
      (
        coordinate -
        edge.start.x
      ) /
      dx
    );
  }

  if (
    Math.abs(dy) <
    EPSILON
  ) {
    return 0;
  }

  return (
    (
      coordinate -
      edge.start.y
    ) /
    dy
  );
}

function intervalFromCoordinates(
  edge:
    WallEdge,
  firstCoordinate:
    number,
  secondCoordinate:
    number,
): OpeningInterval {
  const first =
    coordinateToInterval(
      edge,
      firstCoordinate,
    );

  const second =
    coordinateToInterval(
      edge,
      secondCoordinate,
    );

  return {
    start:
      Math.max(
        0,
        Math.min(
          first,
          second,
        ),
      ),

    end:
      Math.min(
        1,
        Math.max(
          first,
          second,
        ),
      ),
  };
}

/**
 * Explicit architectural openings.
 *
 * Nothing in this function changes the simulation/navigation
 * model. It only determines where visual room walls are omitted.
 */
function getArchitecturalOpenings(
  edge:
    WallEdge,
): readonly OpeningInterval[] {
  const {
    start,
    end,
  } = edge;

  const vertical =
    nearlyEqual(
      start.x,
      end.x,
    );

  const horizontal =
    nearlyEqual(
      start.y,
      end.y,
    );

  /*
   * WEST EGRESS
   *
   * room-west-05 spans x=4..11 and overlaps the original
   * research exit threshold at x=8. We create a visual
   * passage through both sides of that room.
   */
  if (
    vertical &&
    (
      nearlyEqual(
        start.x,
        4,
      ) ||
      nearlyEqual(
        start.x,
        11,
      )
    ) &&
    Math.min(
      start.y,
      end.y,
    ) <=
      23.85 &&
    Math.max(
      start.y,
      end.y,
    ) >=
      25.65
  ) {
    return [
      intervalFromCoordinates(
        edge,
        23.85,
        25.65,
      ),
    ];
  }

  /*
   * EAST EGRESS
   *
   * The research exit is at x=75.5, where the far-east room
   * begins. The renderer therefore creates a passage across
   * that room to an exterior portal at x=81.
   */
  if (
    vertical &&
    nearlyEqual(
      start.x,
      75.5,
    ) &&
    Math.min(
      start.y,
      end.y,
    ) <=
      17.35 &&
    Math.max(
      start.y,
      end.y,
    ) >=
      19.15
  ) {
    return [
      intervalFromCoordinates(
        edge,
        17.35,
        19.15,
      ),
    ];
  }

  if (
    vertical &&
    nearlyEqual(
      start.x,
      81,
    ) &&
    Math.min(
      start.y,
      end.y,
    ) <=
      18.2 &&
    Math.max(
      start.y,
      end.y,
    ) >=
      20
  ) {
    return [
      intervalFromCoordinates(
        edge,
        18.2,
        20,
      ),
    ];
  }

  /*
   * SOUTHEAST EGRESS
   *
   * The frozen exit threshold is at the seam between the two
   * southeast rooms. Remove that dividing wall visually and
   * provide a 1.8 m opening through the exterior wall.
   */
  if (
    vertical &&
    nearlyEqual(
      start.x,
      68.5,
    ) &&
    nearlyEqual(
      Math.min(
        start.y,
        end.y,
      ),
      7,
    ) &&
    nearlyEqual(
      Math.max(
        start.y,
        end.y,
      ),
      13,
    )
  ) {
    return [
      {
        start:
          0,

        end:
          1,
      },
    ];
  }

  if (
    horizontal &&
    nearlyEqual(
      start.y,
      7,
    )
  ) {
    const minimumX =
      Math.min(
        start.x,
        end.x,
      );

    const maximumX =
      Math.max(
        start.x,
        end.x,
      );

    if (
      minimumX <
        68.5 &&
      nearlyEqual(
        maximumX,
        68.5,
      )
    ) {
      return [
        intervalFromCoordinates(
          edge,
          67.6,
          68.5,
        ),
      ];
    }

    if (
      nearlyEqual(
        minimumX,
        68.5,
      ) &&
      maximumX >
        68.5
    ) {
      return [
        intervalFromCoordinates(
          edge,
          68.5,
          69.4,
        ),
      ];
    }
  }

  return [];
}

function interpolatePoint(
  start:
    Position2D,
  end:
    Position2D,
  t:
    number,
): Position2D {
  return {
    x:
      start.x +
      (
        end.x -
        start.x
      ) *
        t,

    y:
      start.y +
      (
        end.y -
        start.y
      ) *
        t,
  };
}

function buildArchitecturalWalls():
  readonly WallSegment[] {
  const roomZones =
    layoutA.zones.filter(
      (
        zone,
      ) =>
        zone.type ===
        "ROOM",
    );

  const uniqueEdges =
    new Map<
      string,
      WallEdge
    >();

  for (
    const room of
      roomZones
  ) {
    const vertices =
      room.polygon.vertices;

    for (
      let index =
        0;
      index <
        vertices.length;
      index +=
        1
    ) {
      const first =
        vertices[index]!;

      const second =
        vertices[
          (
            index +
            1
          ) %
          vertices.length
        ]!;

      const edge =
        canonicalizeSegment(
          first,
          second,
        );

      if (
        !uniqueEdges.has(
          edge.key,
        )
      ) {
        uniqueEdges.set(
          edge.key,
          edge,
        );
      }
    }
  }

  const result:
    WallSegment[] =
  [];

  for (
    const edge of
      uniqueEdges.values()
  ) {
    const openings =
      [...getArchitecturalOpenings(
        edge,
      )]
        .sort(
          (
            first,
            second,
          ) =>
            first.start -
            second.start,
        );

    let cursor =
      0;

    let sectionIndex =
      0;

    for (
      const opening of
        openings
    ) {
      if (
        opening.start >
        cursor
      ) {
        const start =
          interpolatePoint(
            edge.start,
            edge.end,
            cursor,
          );

        const end =
          interpolatePoint(
            edge.start,
            edge.end,
            opening.start,
          );

        if (
          Math.hypot(
            end.x -
              start.x,
            end.y -
              start.y,
          ) >=
          MIN_WALL_SEGMENT_METERS
        ) {
          result.push({
            id:
              `${edge.key}-${sectionIndex}`,

            start,

            end,
          });

          sectionIndex +=
            1;
        }
      }

      cursor =
        Math.max(
          cursor,
          opening.end,
        );
    }

    if (
      cursor <
      1
    ) {
      const start =
        interpolatePoint(
          edge.start,
          edge.end,
          cursor,
        );

      const end = {
        ...edge.end,
      };

      if (
        Math.hypot(
          end.x -
            start.x,
          end.y -
            start.y,
        ) >=
        MIN_WALL_SEGMENT_METERS
      ) {
        result.push({
          id:
            `${edge.key}-${sectionIndex}`,

          start,

          end,
        });
      }
    }
  }

  return result;
}

function Wall({
  segment,
}: {
  readonly segment:
    WallSegment;
}) {
  const startX =
    simulationXToWorldX(
      segment.start.x,
    );

  const startZ =
    simulationYToWorldZ(
      segment.start.y,
    );

  const endX =
    simulationXToWorldX(
      segment.end.x,
    );

  const endZ =
    simulationYToWorldZ(
      segment.end.y,
    );

  const dx =
    endX -
    startX;

  const dz =
    endZ -
    startZ;

  const length =
    Math.hypot(
      dx,
      dz,
    );

  const midpointX =
    (
      startX +
      endX
    ) /
    2;

  const midpointZ =
    (
      startZ +
      endZ
    ) /
    2;

  const rotationY =
    Math.atan2(
      dz,
      dx,
    );

  return (
    <mesh
      castShadow
      receiveShadow
      position={[
        midpointX,
        WALL_BASE_Y +
          WALL_HEIGHT_METERS /
            2,
        midpointZ,
      ]}
      rotation={[
        0,
        -rotationY,
        0,
      ]}
    >
      <boxGeometry
        args={[
          length,
          WALL_HEIGHT_METERS,
          WALL_THICKNESS_METERS,
        ]}
      />

      <meshStandardMaterial
        color="#78909b"
        roughness={0.82}
        metalness={0.01}
      />
    </mesh>
  );
}

function createShape(
  vertices:
    readonly Position2D[],
): THREE.Shape {
  if (
    vertices.length <
    3
  ) {
    throw new Error(
      "Architectural egress area requires at least three vertices.",
    );
  }

  const first =
    vertices[0]!;

  const shape =
    new THREE.Shape();

  shape.moveTo(
    simulationXToWorldX(
      first.x,
    ),

    first.y -
      layoutA.heightMeters /
        2,
  );

  for (
    let index =
      1;
    index <
      vertices.length;
    index +=
      1
  ) {
    const vertex =
      vertices[index]!;

    shape.lineTo(
      simulationXToWorldX(
        vertex.x,
      ),

      vertex.y -
        layoutA.heightMeters /
          2,
    );
  }

  shape.closePath();

  return shape;
}

function EgressArea({
  area,
}: {
  readonly area:
    ArchitecturalEgressArea;
}) {
  const shape =
    useMemo(
      () =>
        createShape(
          area.vertices,
        ),
      [
        area,
      ],
    );

  return (
    <mesh
      receiveShadow
      rotation={[
        -Math.PI /
          2,
        0,
        0,
      ]}
      position={[
        0,
        0.735,
        0,
      ]}
      renderOrder={5}
    >
      <shapeGeometry
        args={[
          shape,
        ]}
      />

      <meshStandardMaterial
        color="#6c9ca8"
        roughness={0.76}
        metalness={0.01}
      />

      <Edges
        threshold={15}
        color="#a0c7cf"
      />
    </mesh>
  );
}

function ExitPortal({
  portal,
}: {
  readonly portal:
    ArchitecturalExitPortal;
}) {
  const worldX =
    simulationXToWorldX(
      portal.position.x,
    );

  const worldZ =
    simulationYToWorldZ(
      portal.position.y,
    );

  const rotationY =
    portal.orientation ===
    "VERTICAL"
      ? Math.PI /
        2
      : 0;

  return (
    <group
      position={[
        worldX,
        0.82,
        worldZ,
      ]}
      rotation={[
        0,
        rotationY,
        0,
      ]}
    >
      <mesh
        castShadow
        position={[
          0,
          -0.18,
          0,
        ]}
      >
        <boxGeometry
          args={[
            portal.widthMeters,
            0.09,
            0.40,
          ]}
        />

        <meshStandardMaterial
          color="#64dde5"
          emissive="#174f55"
          emissiveIntensity={1.25}
        />
      </mesh>

      <mesh
        castShadow
        position={[
          -portal.widthMeters /
            2,
          0.48,
          0,
        ]}
      >
        <boxGeometry
          args={[
            0.1,
            1.25,
            0.15,
          ]}
        />

        <meshStandardMaterial
          color="#70e3e9"
          emissive="#174d52"
          emissiveIntensity={1}
        />
      </mesh>

      <mesh
        castShadow
        position={[
          portal.widthMeters /
            2,
          0.48,
          0,
        ]}
      >
        <boxGeometry
          args={[
            0.1,
            1.25,
            0.15,
          ]}
        />

        <meshStandardMaterial
          color="#70e3e9"
          emissive="#174d52"
          emissiveIntensity={1}
        />
      </mesh>

      <mesh
        castShadow
        position={[
          0,
          1.1,
          0,
        ]}
      >
        <boxGeometry
          args={[
            portal.widthMeters +
              0.1,
            0.1,
            0.15,
          ]}
        />

        <meshStandardMaterial
          color="#70e3e9"
          emissive="#174d52"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

export function LayoutAArchitecturalLayer() {
  const walls =
    useMemo(
      () =>
        buildArchitecturalWalls(),
      [],
    );

  return (
    <group>
      {walls.map(
        (
          segment,
        ) => (
          <Wall
            key={
              segment.id
            }
            segment={
              segment
            }
          />
        ),
      )}

      {ARCHITECTURAL_EGRESS_AREAS.map(
        (
          area,
        ) => (
          <EgressArea
            key={
              area.id
            }
            area={
              area
            }
          />
        ),
      )}

      {ARCHITECTURAL_EXIT_PORTALS.map(
        (
          portal,
        ) => (
          <ExitPortal
            key={
              portal.id
            }
            portal={
              portal
            }
          />
        ),
      )}
    </group>
  );
}