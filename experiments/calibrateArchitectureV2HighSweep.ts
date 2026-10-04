import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  createArchitectureV2AuthoritativeBundle,
} from "../src/app/createArchitectureV2DemoReplay";

import type {
  ArchitectureV2AuthoritativeBundle,
} from "../src/app/createArchitectureV2DemoReplay";

import {
  layoutAArchitectureV2,
} from "../src/environment/layoutAArchitectureV2";

import type {
  ArchitecturePoint,
  ArchitectureRoom,
} from "../src/environment/layoutAArchitectureV2";

import {
  layoutAArchitectureV2Environment,
} from "../src/environment/layoutAArchitectureV2Environment";

import {
  layoutAArchitectureV2Exits,
} from "../src/environment/layoutAArchitectureV2Exits";

import {
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
} from "../src/scenario/researchParameterSet";

import type {
  HeadlessSimulationResult,
} from "../src/types/headlessSimulation";

import type {
  NavigationEdge,
  NavigationNode,
} from "../src/types/navigation";

import type {
  OccupantScenarioInput,
  Position2D,
  ScenarioInstance,
} from "../src/types/scenario";

import type {
  SpawnZone,
} from "../src/types/spawn";

import {
  pointInOrOnRoomPolygon,
} from "../src/visualization/createRoomOccupantPreview";

const MEDIUM_OCCUPANCY =
  42;

const HIGH_SWEEP_POPULATIONS =
  [
    56,
    60,
    64,
    70,
    84,
  ] as const;

const MAXIMUM_SWEEP_POPULATION =
  84;

const MAXIMUM_EXTRA_OCCUPANTS =
  MAXIMUM_SWEEP_POPULATION -
  MEDIUM_OCCUPANCY;

const PARAMETER_SET_VERSION =
  "architecture-v2-high-occupancy-sweep-v1";

const ROOM_AREA_WEIGHT_EXPONENT =
  1.4;

const WALL_CLEARANCE_METERS =
  0.55;

const DOOR_CLEARANCE_METERS =
  0.90;

const MIN_AGENT_SEPARATION_METERS =
  0.85;

const SPAWN_HALF_SIZE_METERS =
  0.08;

const MAX_PLACEMENT_ATTEMPTS =
  30000;

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

function roomDoorPosition(
  room:
    ArchitectureRoom,
): ArchitecturePoint {
  const door =
    room.doors[0];

  if (!door) {
    throw new Error(
      `${room.id} has no door.`,
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
      `${room.id} has an invalid door edge.`,
    );
  }

  return {
    x:
      start.x +
      (
        end.x -
        start.x
      ) *
        door.centerT,

    y:
      start.y +
      (
        end.y -
        start.y
      ) *
        door.centerT,
  };
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
    ArchitectureV2AuthoritativeBundle,
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
        `Spawn zone not found for ${occupant.id}.`,
      );
    }

    const existing =
      groups.get(
        zone.roomZoneId,
      ) ??
      [];

    existing.push({
      x:
        occupant
          .spawnPosition
          .x,

      y:
        occupant
          .spawnPosition
          .y,
    });

    groups.set(
      zone.roomZoneId,
      existing,
    );
  }

  return groups;
}

/**
 * Builds one deterministic weighted sequence of rooms.
 *
 * Using a single sequence makes the sweep nested:
 *
 * 42 ⊂ 56 ⊂ 60 ⊂ 64 ⊂ 70 ⊂ 84
 *
 * Each additional occupant is assigned to the room
 * with the largest current weighted allocation deficit.
 */
function createExtraRoomSequence(
  totalExtras:
    number,
): readonly string[] {
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
      totalExtras;
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
        "Could not select a room for the High sweep.",
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
      `Could not place ${count} High-sweep extras inside ${room.id}. ` +
      `Placed ${accepted.length}.`,
    );
  }

  return accepted;
}

function createMaximumExtraPopulation(
  medium:
    ArchitectureV2AuthoritativeBundle,
): readonly ExtraOccupantDefinition[] {
  const roomSequence =
    createExtraRoomSequence(
      MAXIMUM_EXTRA_OCCUPANTS,
    );

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
      roomSequence[
        index
      ]!;

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
        `Missing generated position ${cursor} for ${roomId}.`,
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

function createSpawnPolygon(
  position:
    Position2D,
) {
  const half =
    SPAWN_HALF_SIZE_METERS;

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
      `Architecture room not found: ${roomId}`,
    );
  }

  return room;
}

function createExtraRecord(
  definition:
    ExtraOccupantDefinition,
  medium:
    ArchitectureV2AuthoritativeBundle,
): ExtraOccupantRecord {
  const agentNumber =
    MEDIUM_OCCUPANCY +
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
      `${room.id} has no room door.`,
    );
  }

  const doorNode =
    medium.graph
      .nodes
      .find(
        (
          node,
        ) =>
          node.id ===
          door.id,
      );

  if (!doorNode) {
    throw new Error(
      `Navigation door node not found: ${door.id}`,
    );
  }

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
      `${id} has zero room-to-door travel distance.`,
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

function createSweepBundle(
  targetPopulation:
    number,
  medium:
    ArchitectureV2AuthoritativeBundle,
  maximumExtras:
    readonly ExtraOccupantDefinition[],
): ArchitectureV2AuthoritativeBundle {
  if (
    targetPopulation <
      MEDIUM_OCCUPANCY ||
    targetPopulation >
      MAXIMUM_SWEEP_POPULATION
  ) {
    throw new Error(
      `Sweep population ${targetPopulation} is outside the supported range.`,
    );
  }

  const requiredExtras =
    targetPopulation -
    MEDIUM_OCCUPANCY;

  const selectedDefinitions =
    maximumExtras.slice(
      0,
      requiredExtras,
    );

  const selectedExtras =
    selectedDefinitions.map(
      (
        definition,
      ) =>
        createExtraRecord(
          definition,
          medium,
        ),
    );

  const scenario:
    ScenarioInstance = {
    ...medium.scenario,

    id:
      `layout-a-v2-${targetPopulation}-d0-adaptive-high-sweep`,

    /**
     * Use the same seed as the approved Medium case.
     *
     * The current scenario is deterministic, but keeping the
     * seed fixed preserves common-random-number discipline
     * if stochastic components are added later.
     */
    seed:
      medium.scenario
        .seed,

    parameterSetVersion:
      PARAMETER_SET_VERSION,

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

  return {
    scenario,

    graph: {
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
    },

    spawnZones: {
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
    },
  };
}

function runBundle(
  bundle:
    ArchitectureV2AuthoritativeBundle,
): HeadlessSimulationResult {
  return runHeadlessSimulation({
    scenario:
      bundle.scenario,

    environment:
      layoutAArchitectureV2Environment,

    graph:
      bundle.graph,

    exits:
      layoutAArchitectureV2Exits,

    spawnZones:
      bundle.spawnZones,

    configuration: {
      strategyId:
        "ADAPTIVE_HYBRID",

      timestepSeconds:
        RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  });
}

function formatNullable(
  value:
    number | null,
): number | string {
  if (
    value ===
    null
  ) {
    return "—";
  }

  return Number(
    value.toFixed(
      2,
    ),
  );
}

function percentChange(
  value:
    number | null,
  baseline:
    number | null,
): number | string {
  if (
    value ===
      null ||
    baseline ===
      null ||
    baseline ===
      0
  ) {
    return "—";
  }

  return Number(
    (
      (
        value -
        baseline
      ) /
      baseline *
      100
    ).toFixed(
      1,
    ),
  );
}

const mediumBundle =
  createArchitectureV2AuthoritativeBundle();

if (
  mediumBundle
    .scenario
    .occupants
    .length !==
  MEDIUM_OCCUPANCY
) {
  throw new Error(
    `Expected authoritative Medium population ${MEDIUM_OCCUPANCY}.`,
  );
}

const maximumExtras =
  createMaximumExtraPopulation(
    mediumBundle,
  );

if (
  maximumExtras.length !==
  MAXIMUM_EXTRA_OCCUPANTS
) {
  throw new Error(
    `Expected ${MAXIMUM_EXTRA_OCCUPANTS} maximum extras, received ${maximumExtras.length}.`,
  );
}

const mediumResult =
  runBundle(
    mediumBundle,
  );

const sweepResults =
  HIGH_SWEEP_POPULATIONS
    .map(
      (
        population,
      ) => {
        const bundle =
          createSweepBundle(
            population,
            mediumBundle,
            maximumExtras,
          );

        return {
          population,

          bundle,

          result:
            runBundle(
              bundle,
            ),
        };
      },
    );

console.log(
  "\n=== ARCHITECTURE V2 HIGH-OCCUPANCY SWEEP ===\n",
);

console.log(
  "Nested design:",
  [
    MEDIUM_OCCUPANCY,
    ...HIGH_SWEEP_POPULATIONS,
  ].join(
    " -> ",
  ),
);

console.log(
  "\n=== EXTRA OCCUPANT DISTRIBUTION AT N = 84 ===\n",
);

const maxExtraCounts =
  countRoomOccurrences(
    maximumExtras.map(
      (
        extra,
      ) =>
        extra.roomId,
    ),
  );

console.table(
  layoutAArchitectureV2
    .rooms
    .map(
      (
        room,
      ) => ({
        roomId:
          room.id,

        addedBy84:
          maxExtraCounts.get(
            room.id,
          ) ??
          0,
      }),
    ),
);

const mediumMetrics =
  mediumResult
    .metrics;

console.log(
  "\n=== HIGH SWEEP RESULTS ===\n",
);

console.table([
  {
    population:
      MEDIUM_OCCUPANCY,

    level:
      "MEDIUM REFERENCE",

    evacuated:
      mediumMetrics
        .evacuatedAgents,

    completionPercent:
      Number(
        (
          mediumMetrics
            .completionRate *
          100
        ).toFixed(
          1,
        ),
      ),

    totalEvacuationTimeSeconds:
      formatNullable(
        mediumMetrics
          .totalEvacuationTimeSeconds,
      ),

    tetChangeVsMediumPercent:
      0,

    p95Seconds:
      formatNullable(
        mediumMetrics
          .p95EvacuationTimeSeconds,
      ),

    maximumDensity:
      formatNullable(
        mediumMetrics
          .maximumLocalDensityPersonsPerSquareMeter,
      ),

    densityChangeVsMediumPercent:
      0,

    queueExposurePersonSeconds:
      Number(
        mediumResult
          .queueMetrics
          .populationQueueWaitPersonSeconds
          .toFixed(
            2,
          ),
      ),

    meanQueueWaitSeconds:
      Number(
        mediumResult
          .queueMetrics
          .meanQueueWaitSeconds
          .toFixed(
            2,
          ),
      ),

    maximumQueueWaitSeconds:
      Number(
        mediumResult
          .queueMetrics
          .maximumQueueWaitSeconds
          .toFixed(
            2,
          ),
      ),

    reroutes:
      mediumMetrics
        .totalReroutes,

    unreachable:
      mediumMetrics
        .unreachableAgents,

    timeouts:
      mediumMetrics
        .timeoutAgents,
  },

  ...sweepResults.map(
    (
      entry,
    ) => {
      const metrics =
        entry.result
          .metrics;

      const queue =
        entry.result
          .queueMetrics;

      return {
        population:
          entry.population,

        level:
          "HIGH CANDIDATE",

        evacuated:
          metrics
            .evacuatedAgents,

        completionPercent:
          Number(
            (
              metrics
                .completionRate *
              100
            ).toFixed(
              1,
            ),
          ),

        totalEvacuationTimeSeconds:
          formatNullable(
            metrics
              .totalEvacuationTimeSeconds,
          ),

        tetChangeVsMediumPercent:
          percentChange(
            metrics
              .totalEvacuationTimeSeconds,

            mediumMetrics
              .totalEvacuationTimeSeconds,
          ),

        p95Seconds:
          formatNullable(
            metrics
              .p95EvacuationTimeSeconds,
          ),

        maximumDensity:
          formatNullable(
            metrics
              .maximumLocalDensityPersonsPerSquareMeter,
          ),

        densityChangeVsMediumPercent:
          percentChange(
            metrics
              .maximumLocalDensityPersonsPerSquareMeter,

            mediumMetrics
              .maximumLocalDensityPersonsPerSquareMeter,
          ),

        queueExposurePersonSeconds:
          Number(
            queue
              .populationQueueWaitPersonSeconds
              .toFixed(
                2,
              ),
          ),

        meanQueueWaitSeconds:
          Number(
            queue
              .meanQueueWaitSeconds
              .toFixed(
                2,
              ),
          ),

        maximumQueueWaitSeconds:
          Number(
            queue
              .maximumQueueWaitSeconds
              .toFixed(
                2,
              ),
          ),

        reroutes:
          metrics
            .totalReroutes,

        unreachable:
          metrics
            .unreachableAgents,

        timeouts:
          metrics
            .timeoutAgents,
      };
    },
  ),
]);

console.log(
  "\n=== HIGH SWEEP EXIT UTILIZATION ===\n",
);

console.table(
  [
    {
      population:
        MEDIUM_OCCUPANCY,

      result:
        mediumResult,
    },

    ...sweepResults.map(
      (
        entry,
      ) => ({
        population:
          entry.population,

        result:
          entry.result,
      }),
    ),
  ].flatMap(
    (
      entry,
    ) =>
      entry.result
        .metrics
        .exitUtilization
        .map(
          (
            exit,
          ) => ({
            population:
              entry.population,

            exitId:
              exit.exitId,

            evacuatedAgents:
              exit.evacuatedAgents,

            fraction:
              Number(
                exit
                  .fractionOfEvacuatedAgents
                  .toFixed(
                    4,
                  ),
              ),
          }),
        ),
  ),
);

console.log(
  "\n=== END HIGH-OCCUPANCY SWEEP ===\n",
);