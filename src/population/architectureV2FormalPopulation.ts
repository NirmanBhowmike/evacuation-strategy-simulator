import {
  layoutAArchitectureV2,
} from "../environment/layoutAArchitectureV2";

import type {
  ArchitecturePoint,
  ArchitectureRoom,
} from "../environment/layoutAArchitectureV2";

import {
  LAYOUT_A_ARCHITECTURE_V2_ID,
} from "../environment/layoutAArchitectureV2Environment";

import {
  layoutAArchitectureV2NavigationGraph,
} from "../environment/layoutAArchitectureV2NavigationGraph";

import {
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_STRESS_TEST_OCCUPANCY,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  NavigationEdge,
  NavigationGraph,
  NavigationNode,
} from "../types/navigation";

import type {
  OccupantScenarioInput,
  Position2D,
  ScenarioInstance,
} from "../types/scenario";

import type {
  SpawnZone,
  SpawnZoneSet,
} from "../types/spawn";

import {
  createRoomOccupantPreview,
  pointInOrOnRoomPolygon,
  ROOM_OCCUPANT_PREVIEW_COUNT,
} from "../visualization/createRoomOccupantPreview";

/**
 * Formal Architecture V2 population levels.
 *
 * Arbitrary occupant counts are deliberately not accepted
 * by the formal population builder.
 */
export type ArchitectureV2FormalPopulationLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface ArchitectureV2FormalPopulationBundle {
  readonly level:
    ArchitectureV2FormalPopulationLevel;

  readonly population:
    number;

  readonly scenario:
    ScenarioInstance;

  readonly graph:
    NavigationGraph;

  readonly spawnZones:
    SpawnZoneSet;
}

/**
 * Fixed spatial-base seed.
 *
 * This identifies the deterministic spatial population
 * definition only.
 *
 * Formal replication seeds will be introduced later at
 * the experiment-scenario layer.
 */
export const ARCHITECTURE_V2_FORMAL_SPATIAL_BASE_SEED =
  1042;

/**
 * LOW was selected before formal experiment execution.
 *
 * Selection method:
 *
 * 1. Treat the frozen 42-person Medium population as the
 *    parent spatial population.
 * 2. Preserve the Medium room-count strata:
 *
 *       3-person rooms -> select 5 of 5
 *       2-person rooms -> select 8 of 12
 *       1-person rooms -> select 1 of 3
 *
 * 3. Among valid room combinations, minimize weighted
 *    spatial coverage loss using room centroids.
 * 4. Within each selected room, retain the existing
 *    Medium occupant closest to the room centroid.
 *
 * Simulation outcomes were not used in this selection.
 *
 * These room IDs are now frozen so production execution
 * does not silently re-optimize LOW if geometry changes.
 */
export const ARCHITECTURE_V2_FORMAL_LOW_ROOM_IDS =
  Object.freeze([
    "room-nw-01",
    "room-nw-02",
    "room-west-upper",
    "room-west-lower",
    "room-west-central-01",
    "room-west-central-02",
    "room-west-central-04",
    "room-central-02",
    "room-central-upper-01",
    "room-east-large",
    "room-east-01",
    "room-far-east",
    "room-southeast-01",
    "room-southeast-02",
  ] as const);

/**
 * Frozen LOW occupant IDs produced by the approved
 * spatial-selection rule above.
 *
 * This is a regression guard as well as useful experiment
 * metadata.
 */
export const ARCHITECTURE_V2_FORMAL_LOW_AGENT_IDS =
  Object.freeze([
    "agent-0001",
    "agent-0003",
    "agent-0007",
    "agent-0009",
    "agent-0011",
    "agent-0016",
    "agent-0019",
    "agent-0023",
    "agent-0026",
    "agent-0028",
    "agent-0031",
    "agent-0035",
    "agent-0039",
    "agent-0042",
  ] as const);

const ROOM_ORIGIN_SPAWN_HALF_SIZE_METERS =
  0.08;

/**
 * HIGH must reproduce the nested occupancy calibration.
 *
 * During calibration, one deterministic extra-occupant
 * sequence was created through the stress-test ceiling:
 *
 * 42 -> ... -> 70 -> ... -> 84
 *
 * HIGH therefore uses the first 28 extra occupants from
 * the same maximum-84 sequence.
 */
const MAXIMUM_CALIBRATED_POPULATION =
  ARCHITECTURE_V2_RESEARCH_STRESS_TEST_OCCUPANCY;

const MAXIMUM_EXTRA_OCCUPANTS =
  MAXIMUM_CALIBRATED_POPULATION -
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY
    .MEDIUM;

const FORMAL_HIGH_EXTRA_OCCUPANTS =
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY
    .HIGH -
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY
    .MEDIUM;

const ROOM_AREA_WEIGHT_EXPONENT =
  1.4;

const WALL_CLEARANCE_METERS =
  0.55;

const DOOR_CLEARANCE_METERS =
  0.90;

const MIN_AGENT_SEPARATION_METERS =
  0.85;

const MAX_PLACEMENT_ATTEMPTS =
  30000;

interface PreparedMediumOccupant {
  readonly id:
    string;

  readonly roomId:
    string;

  readonly spawnPosition:
    Position2D;

  readonly originNodeId:
    string;

  readonly originEdgeId:
    string;

  readonly doorId:
    string;

  readonly doorWidthMeters:
    number;
}

interface MediumOccupantRecord {
  readonly occupant:
    OccupantScenarioInput;

  readonly roomId:
    string;

  readonly originalIndex:
    number;
}

interface ExtraOccupantDefinition {
  readonly sequenceIndex:
    number;

  readonly roomId:
    string;

  readonly position:
    ArchitecturePoint;
}

interface ExtraOccupantRecord {
  readonly occupant:
    OccupantScenarioInput;

  readonly node:
    NavigationNode;

  readonly edge:
    NavigationEdge;

  readonly zone:
    SpawnZone;
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

function requireRoom(
  roomId:
    string,
): ArchitectureRoom {
  const room =
    layoutAArchitectureV2
      .rooms
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          roomId,
      );

  if (!room) {
    throw new Error(
      `Architecture V2 room not found: ${roomId}`,
    );
  }

  return room;
}

function requireSingleRoomDoor(
  roomId:
    string,
): {
  readonly id:
    string;

  readonly widthMeters:
    number;
} {
  const room =
    requireRoom(
      roomId,
    );

  if (
    room.doors.length !==
    1
  ) {
    throw new Error(
      `Architecture V2 formal population requires exactly one door per room. ${roomId} has ${room.doors.length}.`,
    );
  }

  const door =
    room.doors[0];

  if (!door) {
    throw new Error(
      `Architecture V2 room has no door: ${roomId}`,
    );
  }

  return {
    id:
      door.id,

    widthMeters:
      door.widthMeters,
  };
}

function requireBaseDoorNode(
  doorId:
    string,
): NavigationNode {
  const node =
    layoutAArchitectureV2NavigationGraph
      .nodes
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          doorId,
      );

  if (!node) {
    throw new Error(
      `Architecture V2 navigation door node not found: ${doorId}`,
    );
  }

  if (
    node.type !==
    "DOOR"
  ) {
    throw new Error(
      `Architecture V2 navigation node ${doorId} is not a DOOR node.`,
    );
  }

  return node;
}

function createSpawnPolygon(
  position:
    Position2D,
) {
  const half =
    ROOM_ORIGIN_SPAWN_HALF_SIZE_METERS;

  return {
    vertices: [
      {
        x:
          position.x -
          half,

        y:
          position.y -
          half,
      },

      {
        x:
          position.x +
          half,

        y:
          position.y -
          half,
      },

      {
        x:
          position.x +
          half,

        y:
          position.y +
          half,
      },

      {
        x:
          position.x -
          half,

        y:
          position.y +
          half,
      },
    ],
  };
}

function createOriginNode(
  occupant:
    PreparedMediumOccupant,
): NavigationNode {
  return {
    id:
      occupant.originNodeId,

    type:
      "CONNECTOR",

    position: {
      x:
        occupant.spawnPosition.x,

      y:
        occupant.spawnPosition.y,
    },

    zoneId:
      occupant.roomId,
  };
}

function createOriginEdge(
  occupant:
    PreparedMediumOccupant,
): NavigationEdge {
  const doorNode =
    requireBaseDoorNode(
      occupant.doorId,
    );

  const lengthMeters =
    Math.hypot(
      doorNode.position.x -
        occupant.spawnPosition.x,

      doorNode.position.y -
        occupant.spawnPosition.y,
    );

  if (
    lengthMeters <=
    0
  ) {
    throw new Error(
      `Architecture V2 occupant ${occupant.id} has zero room-to-door travel distance.`,
    );
  }

  return {
    id:
      occupant.originEdgeId,

    from:
      occupant.originNodeId,

    to:
      occupant.doorId,

    lengthMeters,

    widthMeters:
      occupant.doorWidthMeters,

    zoneId:
      occupant.roomId,

    bidirectional:
      false,
  };
}

function createSpawnZone(
  occupant:
    PreparedMediumOccupant,
): SpawnZone {
  return {
    id:
      `spawn-${occupant.id}`,

    roomZoneId:
      occupant.roomId,

    accessNodeId:
      occupant.originNodeId,

    polygon:
      createSpawnPolygon(
        occupant.spawnPosition,
      ),
  };
}

function prepareMediumOccupants():
  readonly PreparedMediumOccupant[] {
  const preview =
    createRoomOccupantPreview();

  if (
    ROOM_OCCUPANT_PREVIEW_COUNT !==
    ARCHITECTURE_V2_RESEARCH_OCCUPANCY
      .MEDIUM
  ) {
    throw new Error(
      "Architecture V2 preview population no longer matches frozen formal MEDIUM occupancy.",
    );
  }

  if (
    preview.length !==
    ARCHITECTURE_V2_RESEARCH_OCCUPANCY
      .MEDIUM
  ) {
    throw new Error(
      `Expected ${ARCHITECTURE_V2_RESEARCH_OCCUPANCY.MEDIUM} Medium occupants, received ${preview.length}.`,
    );
  }

  return preview.map(
    (
      previewAgent,
      index,
    ) => {
      const id =
        `agent-${String(
          index +
            1,
        ).padStart(
          4,
          "0",
        )}`;

      const door =
        requireSingleRoomDoor(
          previewAgent.roomId,
        );

      return {
        id,

        roomId:
          previewAgent.roomId,

        spawnPosition: {
          x:
            previewAgent.position.x,

          y:
            previewAgent.position.y,
        },

        originNodeId:
          `room-origin-${id}`,

        originEdgeId:
          `room-origin-edge-${id}`,

        doorId:
          door.id,

        doorWidthMeters:
          door.widthMeters,
      };
    },
  );
}

function createMediumBundle():
  ArchitectureV2FormalPopulationBundle {
  const prepared =
    prepareMediumOccupants();

  const originNodes =
    prepared.map(
      createOriginNode,
    );

  const originEdges =
    prepared.map(
      createOriginEdge,
    );

  const spawnZones:
    SpawnZoneSet = {
    layoutId:
      LAYOUT_A_ARCHITECTURE_V2_ID,

    zones:
      prepared.map(
        createSpawnZone,
      ),
  };

  const graph:
    NavigationGraph = {
    layoutId:
      LAYOUT_A_ARCHITECTURE_V2_ID,

    nodes: [
      ...layoutAArchitectureV2NavigationGraph
        .nodes,

      ...originNodes,
    ],

    edges: [
      ...layoutAArchitectureV2NavigationGraph
        .edges,

      ...originEdges,
    ],
  };

  const scenario:
    ScenarioInstance = {
    id:
      "layout-a-v2-medium-42-formal-spatial-base",

    seed:
      ARCHITECTURE_V2_FORMAL_SPATIAL_BASE_SEED,

    layoutId:
      LAYOUT_A_ARCHITECTURE_V2_ID,

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    occupants:
      prepared.map(
        (
          occupant,
        ) => ({
          id:
            occupant.id,

          spawnPosition: {
            x:
              occupant.spawnPosition.x,

            y:
              occupant.spawnPosition.y,
          },

          /**
           * Spatial population construction remains
           * deterministic.
           *
           * Formal replication-specific walking-speed
           * variation will be applied later by the formal
           * scenario-generation layer.
           */
          desiredSpeedMps:
            1.34,
        }),
      ),

    disruptionSchedule:
      [],
  };

  return {
    level:
      "MEDIUM",

    population:
      ARCHITECTURE_V2_RESEARCH_OCCUPANCY
        .MEDIUM,

    scenario,

    graph,

    spawnZones,
  };
}

function polygonCentroid(
  room:
    ArchitectureRoom,
): ArchitecturePoint {
  const vertices =
    room.polygon;

  if (
    vertices.length <
    3
  ) {
    throw new Error(
      `Architecture V2 room has an invalid polygon: ${room.id}`,
    );
  }

  let twiceArea =
    0;

  let xNumerator =
    0;

  let yNumerator =
    0;

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

    const cross =
      first.x *
        second.y -
      second.x *
        first.y;

    twiceArea +=
      cross;

    xNumerator +=
      (
        first.x +
        second.x
      ) *
      cross;

    yNumerator +=
      (
        first.y +
        second.y
      ) *
      cross;
  }

  if (
    Math.abs(
      twiceArea,
    ) <
    1e-12
  ) {
    throw new Error(
      `Architecture V2 room has zero polygon area: ${room.id}`,
    );
  }

  return {
    x:
      xNumerator /
      (
        3 *
        twiceArea
      ),

    y:
      yNumerator /
      (
        3 *
        twiceArea
      ),
  };
}

function squaredDistance(
  first:
    Position2D,
  second:
    Position2D,
): number {
  const dx =
    second.x -
    first.x;

  const dy =
    second.y -
    first.y;

  return (
    dx *
      dx +
    dy *
      dy
  );
}

function createMediumOccupantRecords(
  medium:
    ArchitectureV2FormalPopulationBundle,
): readonly MediumOccupantRecord[] {
  return medium.scenario
    .occupants
    .map(
      (
        occupant,
        originalIndex,
      ) => {
        const spawnZone =
          medium.spawnZones
            .zones
            .find(
              (
                zone,
              ) =>
                zone.id ===
                `spawn-${occupant.id}`,
            );

        if (!spawnZone) {
          throw new Error(
            `Architecture V2 Medium spawn zone not found for ${occupant.id}.`,
          );
        }

        return {
          occupant,

          roomId:
            spawnZone.roomZoneId,

          originalIndex,
        };
      },
    );
}

function chooseFrozenLowRepresentative(
  roomId:
    string,
  records:
    readonly MediumOccupantRecord[],
): MediumOccupantRecord {
  const room =
    requireRoom(
      roomId,
    );

  const centroid =
    polygonCentroid(
      room,
    );

  const candidates =
    records
      .filter(
        (
          record,
        ) =>
          record.roomId ===
          roomId,
      );

  if (
    candidates.length ===
    0
  ) {
    throw new Error(
      `Frozen Medium population has no occupant in LOW room ${roomId}.`,
    );
  }

  const ranked =
    [
      ...candidates,
    ].sort(
      (
        first,
        second,
      ) => {
        const firstDistance =
          squaredDistance(
            first.occupant
              .spawnPosition,
            centroid,
          );

        const secondDistance =
          squaredDistance(
            second.occupant
              .spawnPosition,
            centroid,
          );

        const difference =
          firstDistance -
          secondDistance;

        if (
          Math.abs(
            difference,
          ) >
          1e-12
        ) {
          return difference;
        }

        return (
          first.originalIndex -
          second.originalIndex
        );
      },
    );

  const selected =
    ranked[0];

  if (!selected) {
    throw new Error(
      `Unable to select frozen LOW representative from ${roomId}.`,
    );
  }

  return selected;
}

function createLowBundle(
  medium:
    ArchitectureV2FormalPopulationBundle,
): ArchitectureV2FormalPopulationBundle {
  const records =
    createMediumOccupantRecords(
      medium,
    );

  const selected =
    ARCHITECTURE_V2_FORMAL_LOW_ROOM_IDS
      .map(
        (
          roomId,
        ) =>
          chooseFrozenLowRepresentative(
            roomId,
            records,
          ),
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.originalIndex -
          second.originalIndex,
      );

  if (
    selected.length !==
    ARCHITECTURE_V2_RESEARCH_OCCUPANCY
      .LOW
  ) {
    throw new Error(
      `Frozen LOW selection produced ${selected.length} occupants instead of ${ARCHITECTURE_V2_RESEARCH_OCCUPANCY.LOW}.`,
    );
  }

  const selectedIds =
    selected.map(
      (
        record,
      ) =>
        record.occupant.id,
    );

  const expectedIds =
    [
      ...ARCHITECTURE_V2_FORMAL_LOW_AGENT_IDS,
    ];

  if (
    selectedIds.length !==
      expectedIds.length ||
    selectedIds.some(
      (
        id,
        index,
      ) =>
        id !==
        expectedIds[index],
    )
  ) {
    throw new Error(
      "Frozen LOW representative occupants changed. Architecture or Medium population drift must be reviewed before formal experiments.",
    );
  }

  const selectedAgentIds =
    new Set(
      selectedIds,
    );

  const selectedOriginNodeIds =
    new Set(
      selectedIds.map(
        (
          id,
        ) =>
          `room-origin-${id}`,
      ),
    );

  const selectedOriginEdgeIds =
    new Set(
      selectedIds.map(
        (
          id,
        ) =>
          `room-origin-edge-${id}`,
      ),
    );

  const selectedSpawnZoneIds =
    new Set(
      selectedIds.map(
        (
          id,
        ) =>
          `spawn-${id}`,
      ),
    );

  const scenario:
    ScenarioInstance = {
    ...medium.scenario,

    id:
      "layout-a-v2-low-14-formal-spatial-base",

    occupants:
      selected.map(
        (
          record,
        ) => ({
          ...record.occupant,

          spawnPosition: {
            x:
              record.occupant
                .spawnPosition.x,

            y:
              record.occupant
                .spawnPosition.y,
          },
        }),
      ),
  };

  const graph:
    NavigationGraph = {
    ...medium.graph,

    nodes:
      medium.graph
        .nodes
        .filter(
          (
            node,
          ) => {
            if (
              !node.id.startsWith(
                "room-origin-agent-",
              )
            ) {
              return true;
            }

            return selectedOriginNodeIds
              .has(
                node.id,
              );
          },
        ),

    edges:
      medium.graph
        .edges
        .filter(
          (
            edge,
          ) => {
            if (
              !edge.id.startsWith(
                "room-origin-edge-agent-",
              )
            ) {
              return true;
            }

            return selectedOriginEdgeIds
              .has(
                edge.id,
              );
          },
        ),
  };

  const spawnZones:
    SpawnZoneSet = {
    ...medium.spawnZones,

    zones:
      medium.spawnZones
        .zones
        .filter(
          (
            zone,
          ) =>
            selectedSpawnZoneIds
              .has(
                zone.id,
              ),
        ),
  };

  if (
    scenario.occupants.length !==
      selectedAgentIds.size ||
    spawnZones.zones.length !==
      selectedAgentIds.size
  ) {
    throw new Error(
      "Frozen LOW population contains inconsistent occupant or spawn-zone counts.",
    );
  }

  return {
    level:
      "LOW",

    population:
      ARCHITECTURE_V2_RESEARCH_OCCUPANCY
        .LOW,

    scenario,

    graph,

    spawnZones,
  };
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
      polygon[index]!;

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
      "Cannot calculate bounding box for an empty Architecture V2 polygon.",
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

function distance(
  first:
    Position2D,
  second:
    Position2D,
): number {
  return Math.hypot(
    second.x -
      first.x,

    second.y -
      first.y,
  );
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
    return distance(
      point,
      start,
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

  const closest:
    ArchitecturePoint = {
    x:
      start.x +
      dx *
        clamped,

    y:
      start.y +
      dy *
        clamped,
  };

  return distance(
    point,
    closest,
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
      room.polygon[index]!;

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
      `Architecture V2 room has no door: ${room.id}`,
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
      `Architecture V2 room has invalid door geometry: ${room.id}`,
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

function mediumPositionsByRoom(
  medium:
    ArchitectureV2FormalPopulationBundle,
): ReadonlyMap<
  string,
  readonly ArchitecturePoint[]
> {
  const groups =
    new Map<
      string,
      ArchitecturePoint[]
    >();

  for (
    const occupant of
      medium.scenario
        .occupants
  ) {
    const zone =
      medium.spawnZones
        .zones
        .find(
          (
            candidate,
          ) =>
            candidate.id ===
            `spawn-${occupant.id}`,
        );

    if (!zone) {
      throw new Error(
        `Architecture V2 Medium spawn zone not found for ${occupant.id}.`,
      );
    }

    const existing =
      groups.get(
        zone.roomZoneId,
      ) ??
      [];

    existing.push({
      x:
        occupant.spawnPosition.x,

      y:
        occupant.spawnPosition.y,
    });

    groups.set(
      zone.roomZoneId,
      existing,
    );
  }

  return groups;
}

/**
 * Same deterministic weighted extra-room sequence used
 * during Architecture V2 High occupancy calibration.
 *
 * Building the sequence to the 84-person stress ceiling
 * is important. HIGH = 70 is then a prefix of that
 * already calibrated sequence.
 */
function createMaximumExtraRoomSequence():
  readonly string[] {
  const weightedRooms =
    layoutAArchitectureV2
      .rooms
      .map(
        (
          room,
        ) => {
          const area =
            polygonArea(
              room.polygon,
            );

          return {
            roomId:
              room.id,

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
      "Architecture V2 room weighting produced no usable total weight.",
    );
  }

  const assigned =
    new Map<
      string,
      number
    >();

  for (
    const entry of
      weightedRooms
  ) {
    assigned.set(
      entry.roomId,
      0,
    );
  }

  const sequence:
    string[] =
  [];

  for (
    let step =
      1;
    step <=
      MAXIMUM_EXTRA_OCCUPANTS;
    step +=
      1
  ) {
    let selected:
      (
        typeof weightedRooms
      )[number] |
      null =
      null;

    let bestDeficit =
      Number.NEGATIVE_INFINITY;

    for (
      const entry of
        weightedRooms
    ) {
      const expectedByNow =
        step *
        (
          entry.weight /
          totalWeight
        );

      const currentAssigned =
        assigned.get(
          entry.roomId,
        ) ??
        0;

      const deficit =
        expectedByNow -
        currentAssigned;

      if (
        selected ===
          null ||
        deficit >
          bestDeficit +
            1e-12 ||
        (
          Math.abs(
            deficit -
            bestDeficit,
          ) <=
            1e-12 &&
          entry.area >
            selected.area +
              1e-12
        ) ||
        (
          Math.abs(
            deficit -
            bestDeficit,
          ) <=
            1e-12 &&
          Math.abs(
            entry.area -
            selected.area,
          ) <=
            1e-12 &&
          entry.roomId.localeCompare(
            selected.roomId,
          ) <
            0
        )
      ) {
        selected =
          entry;

        bestDeficit =
          deficit;
      }
    }

    if (!selected) {
      throw new Error(
        "Unable to generate Architecture V2 calibrated extra-room sequence.",
      );
    }

    sequence.push(
      selected.roomId,
    );

    assigned.set(
      selected.roomId,
      (
        assigned.get(
          selected.roomId,
        ) ??
        0
      ) +
        1,
    );
  }

  return sequence;
}

function countRoomOccurrences(
  roomSequence:
    readonly string[],
): ReadonlyMap<
  string,
  number
> {
  const counts =
    new Map<
      string,
      number
    >();

  for (
    const roomId of
      roomSequence
  ) {
    counts.set(
      roomId,
      (
        counts.get(
          roomId,
        ) ??
        0
      ) +
        1,
    );
  }

  return counts;
}

function createExtraPositionsForRoom(
  room:
    ArchitectureRoom,
  count:
    number,
  existingPositions:
    readonly ArchitecturePoint[],
): readonly ArchitecturePoint[] {
  if (
    count ===
    0
  ) {
    return [];
  }

  const bounds =
    boundingBox(
      room.polygon,
    );

  const doorPosition =
    roomDoorPosition(
      room,
    );

  /**
   * This seed string intentionally matches the completed
   * Architecture V2 High calibration.
   */
  const random =
    createRandom(
      hashString(
        `architecture-v2-high-sweep|${room.id}|max-84`,
      ),
    );

  const accepted:
    ArchitecturePoint[] =
  [];

  let attempts =
    0;

  while (
    accepted.length <
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
      !pointInOrOnRoomPolygon(
        candidate,
        room.polygon,
      )
    ) {
      continue;
    }

    if (
      distanceToRoomWall(
        candidate,
        room,
      ) <
      WALL_CLEARANCE_METERS
    ) {
      continue;
    }

    if (
      distance(
        candidate,
        doorPosition,
      ) <
      DOOR_CLEARANCE_METERS
    ) {
      continue;
    }

    const separatedFromMedium =
      existingPositions.every(
        (
          existing,
        ) =>
          distance(
            candidate,
            existing,
          ) >=
          MIN_AGENT_SEPARATION_METERS,
      );

    if (
      !separatedFromMedium
    ) {
      continue;
    }

    const separatedFromExtras =
      accepted.every(
        (
          existing,
        ) =>
          distance(
            candidate,
            existing,
          ) >=
          MIN_AGENT_SEPARATION_METERS,
      );

    if (
      !separatedFromExtras
    ) {
      continue;
    }

    accepted.push(
      candidate,
    );
  }

  if (
    accepted.length !==
    count
  ) {
    throw new Error(
      `Unable to reproduce calibrated Architecture V2 High positions in ${room.id}. Expected ${count}, placed ${accepted.length}.`,
    );
  }

  return accepted;
}

function createMaximumExtraPopulation(
  medium:
    ArchitectureV2FormalPopulationBundle,
): readonly ExtraOccupantDefinition[] {
  const roomSequence =
    createMaximumExtraRoomSequence();

  const maximumCounts =
    countRoomOccurrences(
      roomSequence,
    );

  const mediumPositions =
    mediumPositionsByRoom(
      medium,
    );

  const generatedPositions =
    new Map<
      string,
      readonly ArchitecturePoint[]
    >();

  for (
    const room of
      layoutAArchitectureV2
        .rooms
  ) {
    const count =
      maximumCounts.get(
        room.id,
      ) ??
      0;

    const existing =
      mediumPositions.get(
        room.id,
      ) ??
      [];

    generatedPositions.set(
      room.id,
      createExtraPositionsForRoom(
        room,
        count,
        existing,
      ),
    );
  }

  const positionCursor =
    new Map<
      string,
      number
    >();

  const definitions:
    ExtraOccupantDefinition[] =
  [];

  for (
    let index =
      0;
    index <
      roomSequence.length;
    index +=
      1
  ) {
    const roomId =
      roomSequence[index]!;

    const cursor =
      positionCursor.get(
        roomId,
      ) ??
      0;

    const roomPositions =
      generatedPositions.get(
        roomId,
      );

    const position =
      roomPositions?.[
        cursor
      ];

    if (!position) {
      throw new Error(
        `Missing calibrated Architecture V2 extra position ${cursor} for ${roomId}.`,
      );
    }

    definitions.push({
      sequenceIndex:
        index,

      roomId,

      position,
    });

    positionCursor.set(
      roomId,
      cursor +
        1,
    );
  }

  return definitions;
}

function createHighExtraRecord(
  definition:
    ExtraOccupantDefinition,
): ExtraOccupantRecord {
  const agentNumber =
    ARCHITECTURE_V2_RESEARCH_OCCUPANCY
      .MEDIUM +
    definition.sequenceIndex +
    1;

  const id =
    `agent-${String(
      agentNumber,
    ).padStart(
      4,
      "0",
    )}`;

  const room =
    requireRoom(
      definition.roomId,
    );

  const door =
    room.doors[0];

  if (!door) {
    throw new Error(
      `Architecture V2 High room has no door: ${room.id}`,
    );
  }

  const doorNode =
    requireBaseDoorNode(
      door.id,
    );

  const originNodeId =
    `room-origin-${id}`;

  const originEdgeId =
    `room-origin-edge-${id}`;

  const lengthMeters =
    Math.hypot(
      doorNode.position.x -
        definition.position.x,

      doorNode.position.y -
        definition.position.y,
    );

  if (
    lengthMeters <=
    0
  ) {
    throw new Error(
      `Architecture V2 High occupant ${id} has zero room-to-door travel distance.`,
    );
  }

  const occupant:
    OccupantScenarioInput = {
    id,

    spawnPosition: {
      x:
        definition.position.x,

      y:
        definition.position.y,
    },

    desiredSpeedMps:
      1.34,
  };

  const node:
    NavigationNode = {
    id:
      originNodeId,

    type:
      "CONNECTOR",

    position: {
      x:
        definition.position.x,

      y:
        definition.position.y,
    },

    zoneId:
      room.id,
  };

  const edge:
    NavigationEdge = {
    id:
      originEdgeId,

    from:
      originNodeId,

    to:
      door.id,

    lengthMeters,

    widthMeters:
      door.widthMeters,

    zoneId:
      room.id,

    bidirectional:
      false,
  };

  const zone:
    SpawnZone = {
    id:
      `spawn-${id}`,

    roomZoneId:
      room.id,

    accessNodeId:
      originNodeId,

    polygon:
      createSpawnPolygon(
        definition.position,
      ),
  };

  return {
    occupant,
    node,
    edge,
    zone,
  };
}

function createHighBundle(
  medium:
    ArchitectureV2FormalPopulationBundle,
): ArchitectureV2FormalPopulationBundle {
  const maximumExtras =
    createMaximumExtraPopulation(
      medium,
    );

  if (
    maximumExtras.length !==
    MAXIMUM_EXTRA_OCCUPANTS
  ) {
    throw new Error(
      `Expected ${MAXIMUM_EXTRA_OCCUPANTS} calibrated Architecture V2 maximum extras, received ${maximumExtras.length}.`,
    );
  }

  const selectedDefinitions =
    maximumExtras.slice(
      0,
      FORMAL_HIGH_EXTRA_OCCUPANTS,
    );

  const selectedExtras =
    selectedDefinitions.map(
      createHighExtraRecord,
    );

  const scenario:
    ScenarioInstance = {
    ...medium.scenario,

    id:
      "layout-a-v2-high-70-formal-spatial-base",

    occupants: [
      ...medium.scenario
        .occupants,

      ...selectedExtras.map(
        (
          extra,
        ) =>
          extra.occupant,
      ),
    ],
  };

  const graph:
    NavigationGraph = {
    ...medium.graph,

    nodes: [
      ...medium.graph
        .nodes,

      ...selectedExtras.map(
        (
          extra,
        ) =>
          extra.node,
      ),
    ],

    edges: [
      ...medium.graph
        .edges,

      ...selectedExtras.map(
        (
          extra,
        ) =>
          extra.edge,
      ),
    ],
  };

  const spawnZones:
    SpawnZoneSet = {
    ...medium.spawnZones,

    zones: [
      ...medium.spawnZones
        .zones,

      ...selectedExtras.map(
        (
          extra,
        ) =>
          extra.zone,
      ),
    ],
  };

  if (
    scenario.occupants.length !==
    ARCHITECTURE_V2_RESEARCH_OCCUPANCY
      .HIGH
  ) {
    throw new Error(
      `Architecture V2 HIGH produced ${scenario.occupants.length} occupants instead of ${ARCHITECTURE_V2_RESEARCH_OCCUPANCY.HIGH}.`,
    );
  }

  if (
    spawnZones.zones.length !==
    ARCHITECTURE_V2_RESEARCH_OCCUPANCY
      .HIGH
  ) {
    throw new Error(
      "Architecture V2 HIGH spawn-zone count does not match formal HIGH occupancy.",
    );
  }

  return {
    level:
      "HIGH",

    population:
      ARCHITECTURE_V2_RESEARCH_OCCUPANCY
        .HIGH,

    scenario,

    graph,

    spawnZones,
  };
}

export function getArchitectureV2FormalPopulationCount(
  level:
    ArchitectureV2FormalPopulationLevel,
): number {
  return ARCHITECTURE_V2_RESEARCH_OCCUPANCY[
    level
  ];
}

/**
 * Creates the frozen spatial population used by formal
 * Architecture V2 experiments.
 *
 * Spatial hierarchy:
 *
 * LOW 14
 *   subset of
 * MEDIUM 42
 *   subset of
 * HIGH 70
 *
 * This function does not assign replication-specific
 * stochastic walking speeds and does not attach a
 * disruption condition.
 *
 * Those belong to the formal experiment-scenario layer.
 */
export function createArchitectureV2FormalPopulationBundle(
  level:
    ArchitectureV2FormalPopulationLevel,
): ArchitectureV2FormalPopulationBundle {
  const medium =
    createMediumBundle();

  if (
    level ===
    "MEDIUM"
  ) {
    return medium;
  }

  if (
    level ===
    "LOW"
  ) {
    return createLowBundle(
      medium,
    );
  }

  return createHighBundle(
    medium,
  );
}