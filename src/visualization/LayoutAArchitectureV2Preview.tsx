import {
  useMemo,
} from "react";

import {
  Edges,
} from "@react-three/drei";

import * as THREE from "three";

import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import type {
  ArchitectureCirculationArea,
  ArchitectureDoor,
  ArchitectureExit,
  ArchitecturePoint,
  ArchitectureRoom,
} from "../environment/layoutAArchitectureV2";

const ROOM_FLOOR_Y =
  0.58;

const CIRCULATION_FLOOR_Y =
  0.60;

const WALL_BASE_Y =
  0.72;

const WALL_HEIGHT =
  1.65;

const WALL_THICKNESS =
  0.11;

const MIN_WALL_LENGTH =
  0.12;

const WALL_KEY_PRECISION =
  4;

interface WallSegment {
  readonly id:
    string;

  readonly start:
    ArchitecturePoint;

  readonly end:
    ArchitecturePoint;
}

function simulationXToWorldX(
  x: number,
): number {
  return (
    x -
    layoutAArchitectureV2
      .widthMeters /
      2
  );
}

function simulationYToWorldZ(
  y: number,
): number {
  return (
    layoutAArchitectureV2
      .heightMeters /
      2 -
    y
  );
}

function createShape(
  polygon:
    readonly ArchitecturePoint[],
): THREE.Shape {
  if (
    polygon.length <
    3
  ) {
    throw new Error(
      "Architecture polygon requires at least three points.",
    );
  }

  const first =
    polygon[0]!;

  const shape =
    new THREE.Shape();

  shape.moveTo(
    simulationXToWorldX(
      first.x,
    ),

    first.y -
      layoutAArchitectureV2
        .heightMeters /
        2,
  );

  for (
    let index =
      1;
    index <
      polygon.length;
    index +=
      1
  ) {
    const point =
      polygon[index]!;

    shape.lineTo(
      simulationXToWorldX(
        point.x,
      ),

      point.y -
        layoutAArchitectureV2
          .heightMeters /
          2,
    );
  }

  shape.closePath();

  return shape;
}

function interpolatePoint(
  start:
    ArchitecturePoint,
  end:
    ArchitecturePoint,
  t:
    number,
): ArchitecturePoint {
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

function pointKey(
  point:
    ArchitecturePoint,
): string {
  return (
    `${point.x.toFixed(
      WALL_KEY_PRECISION,
    )},` +
    `${point.y.toFixed(
      WALL_KEY_PRECISION,
    )}`
  );
}

function canonicalWallKey(
  start:
    ArchitecturePoint,
  end:
    ArchitecturePoint,
): string {
  const startKey =
    pointKey(
      start,
    );

  const endKey =
    pointKey(
      end,
    );

  return startKey <=
    endKey
    ? `${startKey}|${endKey}`
    : `${endKey}|${startKey}`;
}

function splitWallForDoors(
  room:
    ArchitectureRoom,
  edgeIndex:
    number,
  start:
    ArchitecturePoint,
  end:
    ArchitecturePoint,
): readonly WallSegment[] {
  const length =
    Math.hypot(
      end.x -
        start.x,

      end.y -
        start.y,
    );

  if (
    length <
    MIN_WALL_LENGTH
  ) {
    return [];
  }

  const doors =
    room.doors.filter(
      (
        candidate,
      ) =>
        candidate.edgeIndex ===
        edgeIndex,
    );

  if (
    doors.length ===
    0
  ) {
    return [
      {
        id:
          `${room.id}-wall-${edgeIndex}`,

        start,

        end,
      },
    ];
  }

  const intervals =
    doors
      .map(
        (
          door,
        ) => {
          const half =
            (
              door.widthMeters /
              length
            ) /
            2;

          const center =
            Math.max(
              half,
              Math.min(
                1 -
                  half,
                door.centerT,
              ),
            );

          return {
            start:
              Math.max(
                0,
                center -
                  half,
              ),

            end:
              Math.min(
                1,
                center +
                  half,
              ),
          };
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.start -
          second.start,
      );

  const result:
    WallSegment[] =
  [];

  let cursor =
    0;

  let segmentNumber =
    0;

  for (
    const interval of
      intervals
  ) {
    if (
      interval.start >
      cursor
    ) {
      const sectionStart =
        interpolatePoint(
          start,
          end,
          cursor,
        );

      const sectionEnd =
        interpolatePoint(
          start,
          end,
          interval.start,
        );

      if (
        Math.hypot(
          sectionEnd.x -
            sectionStart.x,

          sectionEnd.y -
            sectionStart.y,
        ) >=
        MIN_WALL_LENGTH
      ) {
        result.push({
          id:
            `${room.id}-wall-${edgeIndex}-${segmentNumber}`,

          start:
            sectionStart,

          end:
            sectionEnd,
        });

        segmentNumber +=
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
    const sectionStart =
      interpolatePoint(
        start,
        end,
        cursor,
      );

    if (
      Math.hypot(
        end.x -
          sectionStart.x,

        end.y -
          sectionStart.y,
      ) >=
      MIN_WALL_LENGTH
    ) {
      result.push({
        id:
          `${room.id}-wall-${edgeIndex}-${segmentNumber}`,

        start:
          sectionStart,

        end,
      });
    }
  }

  return result;
}

function buildRoomWalls(
  room:
    ArchitectureRoom,
): readonly WallSegment[] {
  const segments:
    WallSegment[] =
  [];

  for (
    let index =
      0;
    index <
      room.polygon.length;
    index +=
      1
  ) {
    const start =
      room.polygon[
        index
      ]!;

    const end =
      room.polygon[
        (
          index +
          1
        ) %
        room.polygon.length
      ]!;

    segments.push(
      ...splitWallForDoors(
        room,
        index,
        start,
        end,
      ),
    );
  }

  return segments;
}

/**
 * Removes duplicate physical walls shared by adjacent rooms.
 *
 * This is particularly important for the northwest polygon
 * cluster where neighboring rooms intentionally touch.
 */
function deduplicateWalls(
  segments:
    readonly WallSegment[],
): readonly WallSegment[] {
  const unique =
    new Map<
      string,
      WallSegment
    >();

  for (
    const segment of
      segments
  ) {
    const key =
      canonicalWallKey(
        segment.start,
        segment.end,
      );

    if (
      !unique.has(
        key,
      )
    ) {
      unique.set(
        key,
        segment,
      );
    }
  }

  return [
    ...unique.values(),
  ];
}

function PolygonFloor({
  polygon,
  color,
  edgeColor,
  y,
  thickness,
}: {
  readonly polygon:
    readonly ArchitecturePoint[];

  readonly color:
    string;

  readonly edgeColor:
    string;

  readonly y:
    number;

  readonly thickness:
    number;
}) {
  const shape =
    useMemo(
      () =>
        createShape(
          polygon,
        ),
      [
        polygon,
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
        y,
        0,
      ]}
    >
      <extrudeGeometry
        args={[
          shape,
          {
            depth:
              thickness,

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
          color
        }
        roughness={0.84}
        metalness={0.01}
      />

      <Edges
        threshold={15}
        color={
          edgeColor
        }
      />
    </mesh>
  );
}

function RoomFloor({
  room,
}: {
  readonly room:
    ArchitectureRoom;
}) {
  return (
    <PolygonFloor
      polygon={
        room.polygon
      }
      color="#426b7c"
      edgeColor="#82a9b7"
      y={
        ROOM_FLOOR_Y
      }
      thickness={0.16}
    />
  );
}

function CirculationFloor({
  area,
}: {
  readonly area:
    ArchitectureCirculationArea;
}) {
  const color =
    area.kind ===
    "HALL"
      ? "#527f8d"
      : area.kind ===
          "OPEN_AREA"
        ? "#416774"
        : "#6b98a3";

  const edgeColor =
    area.kind ===
    "HALL"
      ? "#99c2ca"
      : "#a9cbd1";

  return (
    <PolygonFloor
      polygon={
        area.polygon
      }
      color={
        color
      }
      edgeColor={
        edgeColor
      }
      y={
        CIRCULATION_FLOOR_Y
      }
      thickness={0.09}
    />
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

  const centerX =
    (
      startX +
      endX
    ) /
    2;

  const centerZ =
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
        centerX,
        WALL_BASE_Y +
          WALL_HEIGHT /
            2,
        centerZ,
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
          WALL_HEIGHT,
          WALL_THICKNESS,
        ]}
      />

      <meshStandardMaterial
        color="#8299a3"
        roughness={0.8}
        metalness={0.01}
      />
    </mesh>
  );
}

function DoorThreshold({
  room,
  door,
}: {
  readonly room:
    ArchitectureRoom;

  readonly door:
    ArchitectureDoor;
}) {
  const edgeStart =
    room.polygon[
      door.edgeIndex
    ];

  const edgeEnd =
    room.polygon[
      (
        door.edgeIndex +
        1
      ) %
      room.polygon.length
    ];

  if (
    !edgeStart ||
    !edgeEnd
  ) {
    throw new Error(
      `Door ${door.id} references an invalid wall edge.`,
    );
  }

  const center =
    interpolatePoint(
      edgeStart,
      edgeEnd,
      door.centerT,
    );

  const dx =
    edgeEnd.x -
    edgeStart.x;

  const dy =
    edgeEnd.y -
    edgeStart.y;

  const rotationY =
    Math.atan2(
      -dy,
      dx,
    );

  return (
    <mesh
      position={[
        simulationXToWorldX(
          center.x,
        ),
        0.755,
        simulationYToWorldZ(
          center.y,
        ),
      ]}
      rotation={[
        0,
        rotationY,
        0,
      ]}
    >
      <boxGeometry
        args={[
          door.widthMeters,
          0.035,
          0.34,
        ]}
      />

      <meshStandardMaterial
        color="#8edce0"
        emissive="#1e5d62"
        emissiveIntensity={0.45}
        roughness={0.54}
      />
    </mesh>
  );
}

function ExitPortal({
  exit,
}: {
  readonly exit:
    ArchitectureExit;
}) {
  const rotationY =
    exit.orientation ===
    "VERTICAL"
      ? Math.PI /
        2
      : 0;

  return (
    <group
      position={[
        simulationXToWorldX(
          exit.position.x,
        ),
        0.82,
        simulationYToWorldZ(
          exit.position.y,
        ),
      ]}
      rotation={[
        0,
        rotationY,
        0,
      ]}
    >
      <mesh
        position={[
          -exit.widthMeters /
            2,
          0.48,
          0,
        ]}
      >
        <boxGeometry
          args={[
            0.11,
            1.35,
            0.16,
          ]}
        />

        <meshStandardMaterial
          color="#71e6eb"
          emissive="#15565b"
          emissiveIntensity={1}
        />
      </mesh>

      <mesh
        position={[
          exit.widthMeters /
            2,
          0.48,
          0,
        ]}
      >
        <boxGeometry
          args={[
            0.11,
            1.35,
            0.16,
          ]}
        />

        <meshStandardMaterial
          color="#71e6eb"
          emissive="#15565b"
          emissiveIntensity={1}
        />
      </mesh>

      <mesh
        position={[
          0,
          1.14,
          0,
        ]}
      >
        <boxGeometry
          args={[
            exit.widthMeters +
              0.1,
            0.11,
            0.16,
          ]}
        />

        <meshStandardMaterial
          color="#71e6eb"
          emissive="#15565b"
          emissiveIntensity={1}
        />
      </mesh>

      <mesh
        position={[
          0,
          -0.18,
          0,
        ]}
      >
        <boxGeometry
          args={[
            exit.widthMeters,
            0.055,
            0.40,
          ]}
        />

        <meshStandardMaterial
          color="#66dfe6"
          emissive="#18565b"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

function ArchitectureFoundation() {
  return (
    <mesh
      receiveShadow
      position={[
        0,
        0.20,
        0,
      ]}
    >
      <boxGeometry
        args={[
          layoutAArchitectureV2
            .widthMeters +
            4,

          0.4,

          layoutAArchitectureV2
            .heightMeters +
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
  );
}

export function LayoutAArchitectureV2Preview() {
  const wallSegments =
    useMemo(
      () =>
        deduplicateWalls(
          layoutAArchitectureV2
            .rooms
            .flatMap(
              (
                room,
              ) =>
                buildRoomWalls(
                  room,
                ),
            ),
        ),
      [],
    );

  return (
    <group>
      <ArchitectureFoundation />

      {layoutAArchitectureV2
        .circulation
        .map(
          (
            area,
          ) => (
            <CirculationFloor
              key={
                area.id
              }
              area={
                area
              }
            />
          ),
        )}

      {layoutAArchitectureV2
        .rooms
        .map(
          (
            room,
          ) => (
            <RoomFloor
              key={
                room.id
              }
              room={
                room
              }
            />
          ),
        )}

      {wallSegments.map(
        (
          segment,
        ) => (
          <Wall
            key={
              canonicalWallKey(
                segment.start,
                segment.end,
              )
            }
            segment={
              segment
            }
          />
        ),
      )}

      {layoutAArchitectureV2
        .rooms
        .flatMap(
          (
            room,
          ) =>
            room.doors.map(
              (
                candidate,
              ) => (
                <DoorThreshold
                  key={
                    candidate.id
                  }
                  room={
                    room
                  }
                  door={
                    candidate
                  }
                />
              ),
            ),
        )}

      {layoutAArchitectureV2
        .exits
        .map(
          (
            exit,
          ) => (
            <ExitPortal
              key={
                exit.id
              }
              exit={
                exit
              }
            />
          ),
        )}
    </group>
  );
}