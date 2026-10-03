import {
  useMemo,
} from "react";

import * as THREE from "three";

import {
  Edges,
} from "@react-three/drei";

import {
  layoutA,
} from "../environment/layoutA";

import {
  layoutAExits,
} from "../environment/layoutAExits";

import {
  layoutANavigationGraph,
} from "../environment/layoutANavigationGraph";

import {
  layoutASpawnZones,
} from "../environment/layoutASpawnZones";

import type {
  BuildingZone,
  ZoneType,
} from "../types/environment";

import type {
  Position2D,
} from "../types/scenario";

import {
  LayoutAArchitecturalLayer,
} from "./LayoutAArchitecturalLayer";

interface ZoneStyle {
  readonly color:
    string;

  readonly edgeColor:
    string;

  readonly baseY:
    number;

  readonly thickness:
    number;

  readonly roughness:
    number;

  readonly metalness:
    number;
}

interface WallSegment {
  readonly id:
    string;

  readonly start:
    Position2D;

  readonly end:
    Position2D;
}

interface DoorInterval {
  readonly start:
    number;

  readonly end:
    number;
}

interface AggregatedWallEdge {
  readonly key:
    string;

  readonly start:
    Position2D;

  readonly end:
    Position2D;

  readonly openings:
    DoorInterval[];
}

const ZONE_STYLES:
  Record<
    ZoneType,
    ZoneStyle
  > = {
    ROOM: {
      color:
        "#3d6476",

      edgeColor:
        "#7396a5",

      baseY:
        0.58,

      thickness:
        0.18,

      roughness:
        0.78,

      metalness:
        0.02,
    },

    CORRIDOR: {
      color:
        "#628d9a",

      edgeColor:
        "#9abac4",

      baseY:
        0.58,

      thickness:
        0.105,

      roughness:
        0.84,

      metalness:
        0.01,
    },

    OPEN_AREA: {
      color:
        "#345666",

      edgeColor:
        "#678c9b",

      baseY:
        0.58,

      thickness:
        0.09,

      roughness:
        0.88,

      metalness:
        0.01,
    },
  };

const EXPERIMENTAL_OVERLAY_ZONE_ID =
  "corridor-main-east-blockable";

const WALL_HEIGHT_METERS =
  1.65;

const WALL_THICKNESS_METERS =
  0.11;

const WALL_BASE_Y =
  0.72;

const DOOR_OPENING_WIDTH_METERS =
  1.25;

const MIN_WALL_SEGMENT_METERS =
  0.28;

const POINT_KEY_PRECISION =
  3;

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

function createZoneShape(
  zone:
    BuildingZone,
): THREE.Shape {
  const vertices =
    zone.polygon.vertices;

  if (
    vertices.length <
    3
  ) {
    throw new Error(
      `Zone ${zone.id} requires at least three polygon vertices.`,
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
    let index = 1;
    index <
    vertices.length;
    index += 1
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

function squaredDistance(
  first:
    Position2D,
  second:
    Position2D,
): number {
  const dx =
    first.x -
    second.x;

  const dy =
    first.y -
    second.y;

  return (
    dx * dx +
    dy * dy
  );
}

function roomCentroid(
  room:
    BuildingZone,
): Position2D {
  const vertices =
    room.polygon.vertices;

  const total =
    vertices.reduce(
      (
        accumulator,
        vertex,
      ) => ({
        x:
          accumulator.x +
          vertex.x,

        y:
          accumulator.y +
          vertex.y,
      }),
      {
        x: 0,
        y: 0,
      },
    );

  return {
    x:
      total.x /
      vertices.length,

    y:
      total.y /
      vertices.length,
  };
}

function projectPointOntoSegment(
  point:
    Position2D,
  start:
    Position2D,
  end:
    Position2D,
): {
  readonly position:
    Position2D;

  readonly t:
    number;

  readonly distanceSquared:
    number;
} {
  const dx =
    end.x -
    start.x;

  const dy =
    end.y -
    start.y;

  const lengthSquared =
    dx * dx +
    dy * dy;

  if (
    lengthSquared ===
    0
  ) {
    return {
      position: {
        ...start,
      },

      t:
        0,

      distanceSquared:
        squaredDistance(
          point,
          start,
        ),
    };
  }

  const unclampedT =
    (
      (
        point.x -
        start.x
      ) *
        dx +
      (
        point.y -
        start.y
      ) *
        dy
    ) /
    lengthSquared;

  const t =
    Math.max(
      0,
      Math.min(
        1,
        unclampedT,
      ),
    );

  const position = {
    x:
      start.x +
      dx * t,

    y:
      start.y +
      dy * t,
  };

  return {
    position,

    t,

    distanceSquared:
      squaredDistance(
        point,
        position,
      ),
  };
}

function getPreferredDoorTarget(
  room:
    BuildingZone,
): Position2D {
  const mappedSpawn =
    layoutASpawnZones.zones
      .find(
        (
          candidate,
        ) =>
          candidate
            .roomZoneId ===
          room.id,
      );

  if (mappedSpawn) {
    const mappedNode =
      layoutANavigationGraph.nodes
        .find(
          (
            candidate,
          ) =>
            candidate.id ===
            mappedSpawn
              .accessNodeId,
        );

    if (!mappedNode) {
      throw new Error(
        `Mapped access node ${mappedSpawn.accessNodeId} was not found.`,
      );
    }

    return {
      x:
        mappedNode.position.x,

      y:
        mappedNode.position.y,
    };
  }

  const centroid =
    roomCentroid(
      room,
    );

  const nearestNode =
    [...layoutANavigationGraph.nodes]
      .sort(
        (
          first,
          second,
        ) =>
          squaredDistance(
            centroid,
            first.position,
          ) -
          squaredDistance(
            centroid,
            second.position,
          ),
      )[0];

  if (!nearestNode) {
    throw new Error(
      "Layout A contains no navigation nodes.",
    );
  }

  return {
    x:
      nearestNode.position.x,

    y:
      nearestNode.position.y,
  };
}

function pointKey(
  point:
    Position2D,
): string {
  return (
    `${point.x.toFixed(
      POINT_KEY_PRECISION,
    )},` +
    `${point.y.toFixed(
      POINT_KEY_PRECISION,
    )}`
  );
}

function canonicalizeSegment(
  start:
    Position2D,
  end:
    Position2D,
): {
  readonly start:
    Position2D;

  readonly end:
    Position2D;

  readonly reversed:
    boolean;

  readonly key:
    string;
} {
  const startKey =
    pointKey(
      start,
    );

  const endKey =
    pointKey(
      end,
    );

  if (
    startKey <=
    endKey
  ) {
    return {
      start,
      end,
      reversed:
        false,

      key:
        `${startKey}|${endKey}`,
    };
  }

  return {
    start:
      end,

    end:
      start,

    reversed:
      true,

    key:
      `${endKey}|${startKey}`,
  };
}

function calculateDoorInterval(
  target:
    Position2D,
  start:
    Position2D,
  end:
    Position2D,
): DoorInterval | null {
  const length =
    Math.hypot(
      end.x -
        start.x,
      end.y -
        start.y,
    );

  if (
    length <
    DOOR_OPENING_WIDTH_METERS +
      0.7
  ) {
    return null;
  }

  const projection =
    projectPointOntoSegment(
      target,
      start,
      end,
    );

  const halfWidthT =
    (
      DOOR_OPENING_WIDTH_METERS /
      length
    ) /
    2;

  const minimumCenter =
    halfWidthT +
    0.08;

  const maximumCenter =
    1 -
    halfWidthT -
    0.08;

  const center =
    Math.max(
      minimumCenter,
      Math.min(
        maximumCenter,
        projection.t,
      ),
    );

  return {
    start:
      center -
      halfWidthT,

    end:
      center +
      halfWidthT,
  };
}

function mergeIntervals(
  intervals:
    readonly DoorInterval[],
): readonly DoorInterval[] {
  if (
    intervals.length ===
    0
  ) {
    return [];
  }

  const ordered =
    [...intervals]
      .sort(
        (
          first,
          second,
        ) =>
          first.start -
          second.start,
      );

  const merged:
    DoorInterval[] = [];

  for (
    const interval of
      ordered
  ) {
    const last =
      merged[
        merged.length -
          1
      ];

    if (
      !last ||
      interval.start >
        last.end
    ) {
      merged.push({
        start:
          interval.start,

        end:
          interval.end,
      });

      continue;
    }

    merged[
      merged.length -
        1
    ] = {
      start:
        last.start,

      end:
        Math.max(
          last.end,
          interval.end,
        ),
    };
  }

  return merged;
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

function buildAnalyticalWallSegments():
  readonly WallSegment[] {
  const roomZones =
    layoutA.zones.filter(
      (
        zone,
      ) =>
        zone.type ===
        "ROOM",
    );

  const aggregated =
    new Map<
      string,
      AggregatedWallEdge
    >();

  for (
    const room of
      roomZones
  ) {
    const vertices =
      room.polygon.vertices;

    const doorTarget =
      getPreferredDoorTarget(
        room,
      );

    let selectedEdgeIndex =
      -1;

    let selectedProjectionDistance =
      Number.POSITIVE_INFINITY;

    for (
      let index = 0;
      index <
      vertices.length;
      index += 1
    ) {
      const start =
        vertices[index]!;

      const end =
        vertices[
          (
            index +
            1
          ) %
          vertices.length
        ]!;

      const projection =
        projectPointOntoSegment(
          doorTarget,
          start,
          end,
        );

      if (
        projection
          .distanceSquared <
        selectedProjectionDistance
      ) {
        selectedProjectionDistance =
          projection
            .distanceSquared;

        selectedEdgeIndex =
          index;
      }
    }

    for (
      let index = 0;
      index <
      vertices.length;
      index += 1
    ) {
      const originalStart =
        vertices[index]!;

      const originalEnd =
        vertices[
          (
            index +
            1
          ) %
          vertices.length
        ]!;

      const canonical =
        canonicalizeSegment(
          originalStart,
          originalEnd,
        );

      let edge =
        aggregated.get(
          canonical.key,
        );

      if (!edge) {
        edge = {
          key:
            canonical.key,

          start:
            canonical.start,

          end:
            canonical.end,

          openings: [],
        };

        aggregated.set(
          canonical.key,
          edge,
        );
      }

      if (
        index !==
        selectedEdgeIndex
      ) {
        continue;
      }

      const originalInterval =
        calculateDoorInterval(
          doorTarget,
          originalStart,
          originalEnd,
        );

      if (!originalInterval) {
        continue;
      }

      const canonicalInterval =
        canonical.reversed
          ? {
              start:
                1 -
                originalInterval.end,

              end:
                1 -
                originalInterval.start,
            }
          : originalInterval;

      edge.openings.push(
        canonicalInterval,
      );
    }
  }

  const result:
    WallSegment[] = [];

  for (
    const edge of
      aggregated.values()
  ) {
    const length =
      Math.hypot(
        edge.end.x -
          edge.start.x,
        edge.end.y -
          edge.start.y,
      );

    if (
      length <
      0.001
    ) {
      continue;
    }

    const intervals =
      mergeIntervals(
        edge.openings,
      );

    let cursor =
      0;

    let sectionIndex =
      0;

    for (
      const interval of
        intervals
    ) {
      if (
        interval.start >
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
            interval.start,
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
          interval.end,
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

function ZoneSlab({
  zone,
}: {
  readonly zone:
    BuildingZone;
}) {
  const style =
    ZONE_STYLES[
      zone.type
    ];

  const shape =
    useMemo(
      () =>
        createZoneShape(
          zone,
        ),
      [
        zone,
      ],
    );

  return (
    <mesh
      castShadow
      receiveShadow
      rotation={[
        -Math.PI /
          2,
        0,
        0,
      ]}
      position={[
        0,
        style.baseY,
        0,
      ]}
    >
      <extrudeGeometry
        args={[
          shape,
          {
            depth:
              style.thickness,

            bevelEnabled:
              false,

            steps:
              1,

            curveSegments:
              1,
          },
        ]}
      />

      <meshStandardMaterial
        color={
          style.color
        }
        roughness={
          style.roughness
        }
        metalness={
          style.metalness
        }
      />

      <Edges
        threshold={15}
        color={
          style.edgeColor
        }
      />
    </mesh>
  );
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

function AnalyticalRoomWalls() {
  const wallSegments =
    useMemo(
      () =>
        buildAnalyticalWallSegments(),
      [],
    );

  return (
    <group>
      {wallSegments.map(
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
    </group>
  );
}

function BuildingFoundation() {
  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[
          0,
          0.2,
          0,
        ]}
      >
        <boxGeometry
          args={[
            layoutA.widthMeters +
              4,
            0.4,
            layoutA.heightMeters +
              4,
          ]}
        />

        <meshStandardMaterial
          color="#0d2430"
          roughness={0.92}
          metalness={0.02}
        />

        <Edges
          threshold={15}
          color="#294e5f"
        />
      </mesh>

      <mesh
        receiveShadow
        position={[
          0,
          0.42,
          0,
        ]}
      >
        <boxGeometry
          args={[
            layoutA.widthMeters +
              2.2,
            0.03,
            layoutA.heightMeters +
              2.2,
          ]}
        />

        <meshStandardMaterial
          color="#14333f"
          roughness={0.92}
          metalness={0.015}
        />
      </mesh>
    </group>
  );
}

function ExperimentalControlOverlay() {
  const zone =
    layoutA.zones.find(
      (
        candidate,
      ) =>
        candidate.id ===
        EXPERIMENTAL_OVERLAY_ZONE_ID,
    );

  if (!zone) {
    throw new Error(
      "Layout A experimental corridor overlay was not found.",
    );
  }

  const shape =
    useMemo(
      () =>
        createZoneShape(
          zone,
        ),
      [
        zone,
      ],
    );

  return (
    <mesh
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
      renderOrder={4}
    >
      <shapeGeometry
        args={[
          shape,
        ]}
      />

      <meshBasicMaterial
        color="#62d7df"
        transparent
        opacity={0.04}
        depthWrite={
          false
        }
      />

      <Edges
        threshold={15}
        color="#468f9f"
      />
    </mesh>
  );
}

function ExitMarker({
  id,
  x,
  y,
  widthMeters,
}: {
  readonly id:
    string;

  readonly x:
    number;

  readonly y:
    number;

  readonly widthMeters:
    number;
}) {
  const worldX =
    simulationXToWorldX(
      x,
    );

  const worldZ =
    simulationYToWorldZ(
      y,
    );

  const isWestOrEast =
    id ===
      "exit-west" ||
    id ===
      "exit-east";

  const rotationY =
    isWestOrEast
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
            widthMeters,
            0.09,
            0.38,
          ]}
        />

        <meshStandardMaterial
          color="#64dde5"
          emissive="#174f55"
          emissiveIntensity={
            1.25
          }
        />
      </mesh>

      <mesh
        castShadow
        position={[
          -widthMeters /
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
          color="#6ee4ea"
          emissive="#164b50"
          emissiveIntensity={
            1.1
          }
        />
      </mesh>

      <mesh
        castShadow
        position={[
          widthMeters /
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
          color="#6ee4ea"
          emissive="#164b50"
          emissiveIntensity={
            1.1
          }
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
            widthMeters +
              0.1,
            0.1,
            0.15,
          ]}
        />

        <meshStandardMaterial
          color="#6ee4ea"
          emissive="#164b50"
          emissiveIntensity={
            1.1
          }
        />
      </mesh>
    </group>
  );
}

export function LayoutABuilding() {
  const physicalZones =
    layoutA.zones.filter(
      (
        zone,
      ) =>
        zone.id !==
        EXPERIMENTAL_OVERLAY_ZONE_ID,
    );

  return (
    <group>
      <BuildingFoundation />

      {physicalZones.map(
        (
          zone,
        ) => (
          <ZoneSlab
            key={
              zone.id
            }
            zone={
              zone
            }
          />
        ),
      )}

      <LayoutAArchitecturalLayer />

      <ExperimentalControlOverlay />

      {false && layoutAExits.exits.map(
        (
          exit,
        ) => (
          <ExitMarker
            key={
              exit.id
            }
            id={
              exit.id
            }
            x={
              exit.position.x
            }
            y={
              exit.position.y
            }
            widthMeters={
              exit.widthMeters
            }
          />
        ),
      )}
    </group>
  );
}