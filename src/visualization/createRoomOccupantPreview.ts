import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import type {
  ArchitecturePoint,
  ArchitectureRoom,
} from "../environment/layoutAArchitectureV2";

/**
 * Visual population used for the Architecture V2
 * room-distribution study.
 *
 * This does NOT change the frozen research-engine
 * occupancy parameters.
 */
export const ROOM_OCCUPANT_PREVIEW_COUNT =
  42;

/**
 * Exponent above 1.0 deliberately gives larger rooms
 * a somewhat stronger population share.
 *
 * Every room still receives at least one occupant.
 */
const ROOM_AREA_WEIGHT_EXPONENT =
  1.4;

const WALL_CLEARANCE_METERS =
  0.55;

const MIN_AGENT_SEPARATION_METERS =
  0.85;

const DOOR_CLEARANCE_METERS =
  0.9;

const MAX_PLACEMENT_ATTEMPTS =
  16000;

export interface RoomOccupantPreviewAgent {
  readonly id:
    string;

  readonly roomId:
    string;

  readonly position:
    ArchitecturePoint;

  /**
   * Visual heading toward the room doorway.
   */
  readonly headingRadians:
    number;

  /**
   * Deterministic appearance variant.
   */
  readonly bodyVariant:
    number;

  readonly heightScale:
    number;

  readonly animationPhase:
    number;
}

interface BoundingBox {
  readonly minX:
    number;

  readonly maxX:
    number;

  readonly minY:
    number;

  readonly maxY:
    number;
}

function polygonArea(
  polygon:
    readonly ArchitecturePoint[],
): number {
  let twiceArea =
    0;

  for (
    let index =
      0;
    index <
      polygon.length;
    index +=
      1
  ) {
    const first =
      polygon[
        index
      ]!;

    const second =
      polygon[
        (
          index +
          1
        ) %
        polygon.length
      ]!;

    twiceArea +=
      first.x *
        second.y -
      second.x *
        first.y;
  }

  return (
    Math.abs(
      twiceArea,
    ) /
    2
  );
}

function boundingBox(
  polygon:
    readonly ArchitecturePoint[],
): BoundingBox {
  if (
    polygon.length ===
    0
  ) {
    throw new Error(
      "Cannot calculate the bounding box of an empty polygon.",
    );
  }

  let minX =
    Number.POSITIVE_INFINITY;

  let maxX =
    Number.NEGATIVE_INFINITY;

  let minY =
    Number.POSITIVE_INFINITY;

  let maxY =
    Number.NEGATIVE_INFINITY;

  for (
    const point of
      polygon
  ) {
    minX =
      Math.min(
        minX,
        point.x,
      );

    maxX =
      Math.max(
        maxX,
        point.x,
      );

    minY =
      Math.min(
        minY,
        point.y,
      );

    maxY =
      Math.max(
        maxY,
        point.y,
      );
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
  };
}

function pointOnSegment(
  point:
    ArchitecturePoint,
  start:
    ArchitecturePoint,
  end:
    ArchitecturePoint,
): boolean {
  const epsilon =
    1e-9;

  const cross =
    (
      point.y -
      start.y
    ) *
      (
        end.x -
        start.x
      ) -
    (
      point.x -
      start.x
    ) *
      (
        end.y -
        start.y
      );

  if (
    Math.abs(
      cross,
    ) >
    epsilon
  ) {
    return false;
  }

  const dot =
    (
      point.x -
      start.x
    ) *
      (
        end.x -
        start.x
      ) +
    (
      point.y -
      start.y
    ) *
      (
        end.y -
        start.y
      );

  if (
    dot <
    -epsilon
  ) {
    return false;
  }

  const squaredLength =
    (
      end.x -
      start.x
    ) **
      2 +
    (
      end.y -
      start.y
    ) **
      2;

  return (
    dot <=
    squaredLength +
      epsilon
  );
}

export function pointInOrOnRoomPolygon(
  point:
    ArchitecturePoint,
  polygon:
    readonly ArchitecturePoint[],
): boolean {
  for (
    let index =
      0;
    index <
      polygon.length;
    index +=
      1
  ) {
    const start =
      polygon[
        index
      ]!;

    const end =
      polygon[
        (
          index +
          1
        ) %
        polygon.length
      ]!;

    if (
      pointOnSegment(
        point,
        start,
        end,
      )
    ) {
      return true;
    }
  }

  let inside =
    false;

  for (
    let firstIndex =
      0,
      secondIndex =
        polygon.length -
        1;
    firstIndex <
    polygon.length;
    secondIndex =
      firstIndex++
  ) {
    const first =
      polygon[
        firstIndex
      ]!;

    const second =
      polygon[
        secondIndex
      ]!;

    const intersects =
      (
        first.y >
        point.y
      ) !==
        (
          second.y >
          point.y
        ) &&
      point.x <
        (
          (
            second.x -
            first.x
          ) *
            (
              point.y -
              first.y
            )
        ) /
          (
            second.y -
            first.y
          ) +
        first.x;

    if (
      intersects
    ) {
      inside =
        !inside;
    }
  }

  return inside;
}

function distancePointToSegment(
  point:
    ArchitecturePoint,
  start:
    ArchitecturePoint,
  end:
    ArchitecturePoint,
): number {
  const dx =
    end.x -
    start.x;

  const dy =
    end.y -
    start.y;

  const squaredLength =
    dx *
      dx +
    dy *
      dy;

  if (
    squaredLength ===
    0
  ) {
    return Math.hypot(
      point.x -
        start.x,
      point.y -
        start.y,
    );
  }

  const projection =
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
    squaredLength;

  const clamped =
    Math.max(
      0,
      Math.min(
        1,
        projection,
      ),
    );

  const closestX =
    start.x +
    dx *
      clamped;

  const closestY =
    start.y +
    dy *
      clamped;

  return Math.hypot(
    point.x -
      closestX,
    point.y -
      closestY,
  );
}

function distanceToRoomWall(
  point:
    ArchitecturePoint,
  room:
    ArchitectureRoom,
): number {
  let minimum =
    Number.POSITIVE_INFINITY;

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

    minimum =
      Math.min(
        minimum,
        distancePointToSegment(
          point,
          start,
          end,
        ),
      );
  }

  return minimum;
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

function roomDoorPosition(
  room:
    ArchitectureRoom,
): ArchitecturePoint {
  const door =
    room.doors[0];

  if (!door) {
    throw new Error(
      `Room ${room.id} has no architecture door.`,
    );
  }

  const start =
    room.polygon[
      door.edgeIndex
    ];

  const end =
    room.polygon[
      (
        door.edgeIndex +
        1
      ) %
      room.polygon.length
    ];

  if (
    !start ||
    !end
  ) {
    throw new Error(
      `Room ${room.id} has a door with an invalid edge index.`,
    );
  }

  return interpolatePoint(
    start,
    end,
    door.centerT,
  );
}

function hashString(
  value:
    string,
): number {
  let hash =
    2166136261;

  for (
    let index =
      0;
    index <
      value.length;
    index +=
      1
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return (
    hash >>>
    0
  );
}

function createRandom(
  seed:
    number,
): () => number {
  let state =
    seed >>>
    0;

  return () => {
    state +=
      0x6d2b79f5;

    let value =
      state;

    value =
      Math.imul(
        value ^
          (
            value >>>
            15
          ),
        value |
          1,
      );

    value ^=
      value +
      Math.imul(
        value ^
          (
            value >>>
            7
          ),
        value |
          61,
      );

    return (
      (
        value ^
        (
          value >>>
          14
        )
      ) >>>
      0
    ) /
      4294967296;
  };
}

function distance(
  first:
    ArchitecturePoint,
  second:
    ArchitecturePoint,
): number {
  return Math.hypot(
    second.x -
      first.x,
    second.y -
      first.y,
  );
}

/**
 * Creates a deterministic 42-person visual distribution.
 *
 * Every room receives one occupant first.
 *
 * Remaining occupants are allocated according to:
 *
 * roomWeight = roomArea ^ 1.4
 *
 * This gives visibly larger rooms somewhat greater
 * occupancy than a purely linear area allocation.
 */
export function createRoomOccupantDistribution():
  ReadonlyMap<
    string,
    number
  > {
  const rooms =
    layoutAArchitectureV2
      .rooms;

  if (
    ROOM_OCCUPANT_PREVIEW_COUNT <
    rooms.length
  ) {
    throw new Error(
      "Preview population is too small to place at least one occupant in every room.",
    );
  }

  const counts =
    new Map<
      string,
      number
    >();

  for (
    const room of
      rooms
  ) {
    counts.set(
      room.id,
      1,
    );
  }

  let remaining =
    ROOM_OCCUPANT_PREVIEW_COUNT -
    rooms.length;

  if (
    remaining ===
    0
  ) {
    return counts;
  }

  const weightedRooms =
    rooms.map(
      (
        room,
      ) => {
        const area =
          polygonArea(
            room.polygon,
          );

        return {
          room,

          area,

          weight:
            area **
            ROOM_AREA_WEIGHT_EXPONENT,
        };
      },
    );

  const totalWeight =
    weightedRooms.reduce(
      (
        sum,
        entry,
      ) =>
        sum +
        entry.weight,
      0,
    );

  if (
    totalWeight <=
    0
  ) {
    throw new Error(
      "Architecture V2 rooms have no usable population weight.",
    );
  }

  const allocations =
    weightedRooms.map(
      (
        entry,
      ) => {
        const ideal =
          (
            entry.weight /
            totalWeight
          ) *
          remaining;

        const whole =
          Math.floor(
            ideal,
          );

        return {
          roomId:
            entry.room.id,

          whole,

          remainder:
            ideal -
            whole,

          area:
            entry.area,
        };
      },
    );

  let assignedExtras =
    0;

  for (
    const allocation of
      allocations
  ) {
    counts.set(
      allocation.roomId,
      (
        counts.get(
          allocation.roomId,
        ) ??
        0
      ) +
        allocation.whole,
    );

    assignedExtras +=
      allocation.whole;
  }

  remaining -=
    assignedExtras;

  /**
   * Largest fractional remainder wins.
   *
   * If fractional remainders tie, larger rooms win first.
   * The final ID comparison keeps everything deterministic.
   */
  const ranked =
    [
      ...allocations,
    ].sort(
      (
        first,
        second,
      ) => {
        const remainderDifference =
          second.remainder -
          first.remainder;

        if (
          Math.abs(
            remainderDifference,
          ) >
          1e-12
        ) {
          return remainderDifference;
        }

        const areaDifference =
          second.area -
          first.area;

        if (
          Math.abs(
            areaDifference,
          ) >
          1e-12
        ) {
          return areaDifference;
        }

        return first.roomId.localeCompare(
          second.roomId,
        );
      },
    );

  for (
    let index =
      0;
    index <
      remaining;
    index +=
      1
  ) {
    const selected =
      ranked[
        index %
        ranked.length
      ];

    if (!selected) {
      throw new Error(
        "Unable to complete room occupant allocation.",
      );
    }

    counts.set(
      selected.roomId,
      (
        counts.get(
          selected.roomId,
        ) ??
        0
      ) +
        1,
    );
  }

  return counts;
}

function candidateIsAcceptable(
  candidate:
    ArchitecturePoint,
  room:
    ArchitectureRoom,
  doorPosition:
    ArchitecturePoint,
  alreadyPlaced:
    readonly ArchitecturePoint[],
): boolean {
  if (
    !pointInOrOnRoomPolygon(
      candidate,
      room.polygon,
    )
  ) {
    return false;
  }

  if (
    distanceToRoomWall(
      candidate,
      room,
    ) <
    WALL_CLEARANCE_METERS
  ) {
    return false;
  }

  if (
    distance(
      candidate,
      doorPosition,
    ) <
    DOOR_CLEARANCE_METERS
  ) {
    return false;
  }

  return alreadyPlaced.every(
    (
      existing,
    ) =>
      distance(
        candidate,
        existing,
      ) >=
      MIN_AGENT_SEPARATION_METERS,
  );
}

function createRoomPositions(
  room:
    ArchitectureRoom,
  count:
    number,
): readonly ArchitecturePoint[] {
  const bounds =
    boundingBox(
      room.polygon,
    );

  const doorPosition =
    roomDoorPosition(
      room,
    );

  const random =
    createRandom(
      hashString(
        `room-occupant-preview|${room.id}|v2|population-42`,
      ),
    );

  const positions:
    ArchitecturePoint[] =
  [];

  let attempts =
    0;

  while (
    positions.length <
      count &&
    attempts <
      MAX_PLACEMENT_ATTEMPTS
  ) {
    attempts +=
      1;

    const candidate:
      ArchitecturePoint = {
      x:
        bounds.minX +
        random() *
          (
            bounds.maxX -
            bounds.minX
          ),

      y:
        bounds.minY +
        random() *
          (
            bounds.maxY -
            bounds.minY
          ),
    };

    if (
      candidateIsAcceptable(
        candidate,
        room,
        doorPosition,
        positions,
      )
    ) {
      positions.push(
        candidate,
      );
    }
  }

  if (
    positions.length !==
    count
  ) {
    throw new Error(
      `Could not place ${count} preview occupants safely inside ${room.id}. ` +
      `Placed ${positions.length}.`,
    );
  }

  return positions;
}

function headingTowardDoor(
  position:
    ArchitecturePoint,
  doorPosition:
    ArchitecturePoint,
): number {
  const worldDeltaX =
    doorPosition.x -
    position.x;

  /**
   * Simulation +Y maps to Three.js -Z.
   */
  const worldDeltaZ =
    position.y -
    doorPosition.y;

  return Math.atan2(
    worldDeltaX,
    worldDeltaZ,
  );
}

/**
 * Deterministic, visual-only room population.
 *
 * These 42 positions are not passed into the validated
 * research engine.
 */
export function createRoomOccupantPreview():
  readonly RoomOccupantPreviewAgent[] {
  const distribution =
    createRoomOccupantDistribution();

  const agents:
    RoomOccupantPreviewAgent[] =
  [];

  let globalIndex =
    0;

  for (
    const room of
      layoutAArchitectureV2
        .rooms
  ) {
    const count =
      distribution.get(
        room.id,
      ) ??
      0;

    const doorPosition =
      roomDoorPosition(
        room,
      );

    const positions =
      createRoomPositions(
        room,
        count,
      );

    for (
      let roomIndex =
        0;
      roomIndex <
        positions.length;
      roomIndex +=
        1
    ) {
      const position =
        positions[
          roomIndex
        ]!;

      const identitySeed =
        hashString(
          `${room.id}|${roomIndex}|preview-human-42`,
        );

      agents.push({
        id:
          `room-preview-${String(
            globalIndex +
              1,
          ).padStart(
            2,
            "0",
          )}`,

        roomId:
          room.id,

        position,

        headingRadians:
          headingTowardDoor(
            position,
            doorPosition,
          ),

        bodyVariant:
          identitySeed %
          5,

        heightScale:
          0.92 +
          (
            (
              identitySeed >>>
              8
            ) %
            9
          ) /
            100,

        animationPhase:
          (
            (
              identitySeed >>>
              16
            ) %
            628
          ) /
          100,
      });

      globalIndex +=
        1;
    }
  }

  if (
    agents.length !==
    ROOM_OCCUPANT_PREVIEW_COUNT
  ) {
    throw new Error(
      `Expected ${ROOM_OCCUPANT_PREVIEW_COUNT} preview occupants, created ${agents.length}.`,
    );
  }

  return agents;
}