import {
  createArchitectureV2AuthoritativeBundle,
} from "../src/app/createArchitectureV2DemoReplay";

import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

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
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../src/scenario/architectureV2ResearchParameterSet";

import type {
  ArchitectureV2AuthoritativeBundle,
} from "../src/app/createArchitectureV2DemoReplay";

import type {
  OccupantScenarioInput,
  ScenarioInstance,
} from "../src/types/scenario";

interface MediumOccupantRecord {
  readonly occupant:
    OccupantScenarioInput;

  readonly roomId:
    string;

  readonly originalIndex:
    number;
}

interface RoomRecord {
  readonly roomId:
    string;

  readonly mediumCount:
    number;

  readonly centroid:
    ArchitecturePoint;
}

interface StratumRecord {
  readonly mediumCountPerRoom:
    number;

  readonly rooms:
    readonly RoomRecord[];

  readonly proportionalLowCount:
    number;
}

interface CandidateSolution {
  readonly selectedRooms:
    readonly RoomRecord[];

  readonly spatialCoverageLoss:
    number;

  readonly signature:
    string;
}

const LOW_OCCUPANCY =
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY
    .LOW;

const MEDIUM_OCCUPANCY =
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY
    .MEDIUM;

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
      `Room ${room.id} does not have a valid polygon.`,
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
      vertices[
        index
      ]!;

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
      `Room ${room.id} has zero polygon area.`,
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

function distanceSquared(
  first:
    ArchitecturePoint,
  second:
    ArchitecturePoint,
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

function requireMediumOccupantRecords(
  medium:
    ArchitectureV2AuthoritativeBundle,
): readonly MediumOccupantRecord[] {
  if (
    medium.scenario
      .occupants
      .length !==
    MEDIUM_OCCUPANCY
  ) {
    throw new Error(
      `Expected ${MEDIUM_OCCUPANCY} Medium occupants, received ${medium.scenario.occupants.length}.`,
    );
  }

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
            `Spawn zone not found for ${occupant.id}.`,
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

function createRoomRecords(
  occupants:
    readonly MediumOccupantRecord[],
): readonly RoomRecord[] {
  const counts =
    new Map<
      string,
      number
    >();

  for (
    const occupant of
      occupants
  ) {
    counts.set(
      occupant.roomId,
      (
        counts.get(
          occupant.roomId,
        ) ??
        0
      ) +
        1,
    );
  }

  return layoutAArchitectureV2
    .rooms
    .map(
      (
        room,
      ) => {
        const mediumCount =
          counts.get(
            room.id,
          ) ??
          0;

        if (
          mediumCount <=
          0
        ) {
          throw new Error(
            `Frozen Medium population has no occupant in ${room.id}.`,
          );
        }

        return {
          roomId:
            room.id,

          mediumCount,

          centroid:
            polygonCentroid(
              room,
            ),
        };
      },
    );
}

function createStrata(
  rooms:
    readonly RoomRecord[],
): readonly StratumRecord[] {
  const grouped =
    new Map<
      number,
      RoomRecord[]
    >();

  for (
    const room of
      rooms
  ) {
    const existing =
      grouped.get(
        room.mediumCount,
      ) ??
      [];

    existing.push(
      room,
    );

    grouped.set(
      room.mediumCount,
      existing,
    );
  }

  const strata =
    [
      ...grouped.entries(),
    ]
      .map(
        (
          [
            mediumCountPerRoom,
            groupedRooms,
          ],
        ) => {
          const totalMediumOccupants =
            mediumCountPerRoom *
            groupedRooms.length;

          const idealLowOccupants =
            totalMediumOccupants *
            LOW_OCCUPANCY /
            MEDIUM_OCCUPANCY;

          /**
           * Each selected room contributes exactly one
           * LOW occupant in this design.
           *
           * For the calibrated 42 -> 14 relationship,
           * each stratum produces an exact integer:
           *
           * 3-person rooms: 15 / 3 = 5
           * 2-person rooms: 24 / 3 = 8
           * 1-person rooms:  3 / 3 = 1
           */
          const proportionalLowCount =
            Math.round(
              idealLowOccupants,
            );

          if (
            Math.abs(
              idealLowOccupants -
              proportionalLowCount,
            ) >
            1e-12
          ) {
            throw new Error(
              `Room-count stratum ${mediumCountPerRoom} does not produce an exact LOW allocation.`,
            );
          }

          if (
            proportionalLowCount >
            groupedRooms.length
          ) {
            throw new Error(
              `LOW stratum allocation exceeds available rooms for Medium count ${mediumCountPerRoom}.`,
            );
          }

          return {
            mediumCountPerRoom,

            rooms:
              [
                ...groupedRooms,
              ].sort(
                (
                  first,
                  second,
                ) =>
                  first.roomId
                    .localeCompare(
                      second.roomId,
                    ),
              ),

            proportionalLowCount,
          };
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          second.mediumCountPerRoom -
          first.mediumCountPerRoom,
      );

  const totalLow =
    strata.reduce(
      (
        sum,
        stratum,
      ) =>
        sum +
        stratum.proportionalLowCount,
      0,
    );

  if (
    totalLow !==
    LOW_OCCUPANCY
  ) {
    throw new Error(
      `Stratified LOW design allocates ${totalLow} occupants instead of ${LOW_OCCUPANCY}.`,
    );
  }

  return strata;
}

function combinations<T>(
  values:
    readonly T[],
  choose:
    number,
): readonly (readonly T[])[] {
  if (
    choose <
      0 ||
    choose >
      values.length
  ) {
    return [];
  }

  if (
    choose ===
    0
  ) {
    return [
      [],
    ];
  }

  if (
    choose ===
    values.length
  ) {
    return [
      [
        ...values,
      ],
    ];
  }

  const result:
    T[][] =
  [];

  function visit(
    start:
      number,
    current:
      T[],
  ): void {
    if (
      current.length ===
      choose
    ) {
      result.push(
        [
          ...current,
        ],
      );

      return;
    }

    const remainingNeeded =
      choose -
      current.length;

    const lastStart =
      values.length -
      remainingNeeded;

    for (
      let index =
        start;
      index <=
        lastStart;
      index +=
        1
    ) {
      const value =
        values[
          index
        ];

      if (
        value ===
        undefined
      ) {
        throw new Error(
          "Unexpected combination-generation failure.",
        );
      }

      current.push(
        value,
      );

      visit(
        index +
          1,
        current,
      );

      current.pop();
    }
  }

  visit(
    0,
    [],
  );

  return result;
}

/**
 * Measures how well the selected LOW rooms cover the
 * spatial distribution of the frozen Medium population.
 *
 * Every Medium room contributes according to its
 * Medium occupant count.
 *
 * For each Medium room, measure the squared distance
 * from its centroid to the nearest selected LOW room.
 *
 * Lower values mean less spatial coverage loss.
 *
 * Evacuation time, routes, exits, hazards, congestion,
 * and simulation outcomes are NOT used here.
 */
function calculateSpatialCoverageLoss(
  allRooms:
    readonly RoomRecord[],
  selectedRooms:
    readonly RoomRecord[],
): number {
  if (
    selectedRooms.length ===
    0
  ) {
    return Number.POSITIVE_INFINITY;
  }

  let weightedLoss =
    0;

  let totalWeight =
    0;

  for (
    const room of
      allRooms
  ) {
    let nearestDistanceSquared =
      Number.POSITIVE_INFINITY;

    for (
      const selected of
        selectedRooms
    ) {
      nearestDistanceSquared =
        Math.min(
          nearestDistanceSquared,
          distanceSquared(
            room.centroid,
            selected.centroid,
          ),
        );
    }

    weightedLoss +=
      room.mediumCount *
      nearestDistanceSquared;

    totalWeight +=
      room.mediumCount;
  }

  return (
    weightedLoss /
    totalWeight
  );
}

function combineStratumSelections(
  strata:
    readonly StratumRecord[],
): readonly (readonly RoomRecord[])[] {
  let partialSelections:
    readonly (readonly RoomRecord[])[] =
    [
      [],
    ];

  for (
    const stratum of
      strata
  ) {
    const options =
      combinations(
        stratum.rooms,
        stratum.proportionalLowCount,
      );

    const next:
      RoomRecord[][] =
    [];

    for (
      const partial of
        partialSelections
    ) {
      for (
        const option of
          options
      ) {
        next.push([
          ...partial,
          ...option,
        ]);
      }
    }

    partialSelections =
      next;
  }

  return partialSelections;
}

function chooseBestSpatiallyBalancedRooms(
  rooms:
    readonly RoomRecord[],
  strata:
    readonly StratumRecord[],
): CandidateSolution {
  const candidates =
    combineStratumSelections(
      strata,
    );

  if (
    candidates.length ===
    0
  ) {
    throw new Error(
      "No valid LOW room combinations were generated.",
    );
  }

  let best:
    CandidateSolution |
    null =
    null;

  for (
    const selectedRooms of
      candidates
  ) {
    if (
      selectedRooms.length !==
      LOW_OCCUPANCY
    ) {
      throw new Error(
        `Candidate LOW solution contains ${selectedRooms.length} rooms.`,
      );
    }

    const spatialCoverageLoss =
      calculateSpatialCoverageLoss(
        rooms,
        selectedRooms,
      );

    const signature =
      selectedRooms
        .map(
          (
            room,
          ) =>
            room.roomId,
        )
        .sort()
        .join(
          "|",
        );

    if (
      best ===
        null ||
      spatialCoverageLoss <
        best.spatialCoverageLoss -
          1e-12 ||
      (
        Math.abs(
          spatialCoverageLoss -
          best.spatialCoverageLoss,
        ) <=
          1e-12 &&
        signature.localeCompare(
          best.signature,
        ) <
          0
      )
    ) {
      best = {
        selectedRooms:
          [
            ...selectedRooms,
          ],

        spatialCoverageLoss,

        signature,
      };
    }
  }

  if (!best) {
    throw new Error(
      "Unable to choose a spatially balanced LOW room set.",
    );
  }

  return best;
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

/**
 * Selects the frozen Medium occupant nearest the
 * architectural centroid of a chosen room.
 *
 * This provides one representative existing position
 * without generating a new LOW-only spawn point.
 */
function chooseRepresentativeOccupant(
  roomId:
    string,
  occupants:
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
    occupants
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
      `No frozen Medium occupants found in ${roomId}.`,
    );
  }

  const ranked =
    [
      ...candidates,
    ]
      .sort(
        (
          first,
          second,
        ) => {
          const firstDistance =
            distanceSquared(
              first.occupant
                .spawnPosition,
              centroid,
            );

          const secondDistance =
            distanceSquared(
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
    ranked[
      0
    ];

  if (!selected) {
    throw new Error(
      `Unable to select representative Medium occupant from ${roomId}.`,
    );
  }

  return selected;
}

function selectLowPopulation(
  selectedRooms:
    readonly RoomRecord[],
  mediumOccupants:
    readonly MediumOccupantRecord[],
): readonly MediumOccupantRecord[] {
  const selected =
    selectedRooms
      .map(
        (
          room,
        ) =>
          chooseRepresentativeOccupant(
            room.roomId,
            mediumOccupants,
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
    LOW_OCCUPANCY
  ) {
    throw new Error(
      `LOW selection contains ${selected.length} occupants instead of ${LOW_OCCUPANCY}.`,
    );
  }

  const uniqueIds =
    new Set(
      selected.map(
        (
          record,
        ) =>
          record.occupant.id,
      ),
    );

  if (
    uniqueIds.size !==
    LOW_OCCUPANCY
  ) {
    throw new Error(
      "LOW representative selection produced duplicate occupants.",
    );
  }

  return selected;
}

function createLowBundle(
  medium:
    ArchitectureV2AuthoritativeBundle,
  selected:
    readonly MediumOccupantRecord[],
): ArchitectureV2AuthoritativeBundle {
  const selectedAgentIds =
    new Set(
      selected.map(
        (
          record,
        ) =>
          record.occupant.id,
      ),
    );

  const selectedOriginNodeIds =
    new Set(
      [
        ...selectedAgentIds,
      ].map(
        (
          id,
        ) =>
          `room-origin-${id}`,
      ),
    );

  const selectedOriginEdgeIds =
    new Set(
      [
        ...selectedAgentIds,
      ].map(
        (
          id,
        ) =>
          `room-origin-edge-${id}`,
      ),
    );

  const selectedSpawnZoneIds =
    new Set(
      [
        ...selectedAgentIds,
      ].map(
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
      "layout-a-v2-low-14-d0-spatially-balanced-design",

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    occupants:
      selected.map(
        (
          record,
        ) => ({
          ...record.occupant,

          spawnPosition: {
            x:
              record
                .occupant
                .spawnPosition
                .x,

            y:
              record
                .occupant
                .spawnPosition
                .y,
          },
        }),
      ),

    disruptionSchedule:
      [],
  };

  return {
    scenario,

    graph: {
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
    },

    spawnZones: {
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
    },
  };
}

function runLowBaseline(
  low:
    ArchitectureV2AuthoritativeBundle,
) {
  return runHeadlessSimulation({
    scenario:
      low.scenario,

    environment:
      layoutAArchitectureV2Environment,

    graph:
      low.graph,

    exits:
      layoutAArchitectureV2Exits,

    spawnZones:
      low.spawnZones,

    configuration: {
      strategyId:
        "ADAPTIVE_HYBRID",

      timestepSeconds:
        ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  });
}

const medium =
  createArchitectureV2AuthoritativeBundle();

const mediumOccupants =
  requireMediumOccupantRecords(
    medium,
  );

const rooms =
  createRoomRecords(
    mediumOccupants,
  );

const strata =
  createStrata(
    rooms,
  );

const solution =
  chooseBestSpatiallyBalancedRooms(
    rooms,
    strata,
  );

const selected =
  selectLowPopulation(
    solution.selectedRooms,
    mediumOccupants,
  );

const low =
  createLowBundle(
    medium,
    selected,
  );

const result =
  runLowBaseline(
    low,
  );

const selectedRoomIds =
  new Set(
    solution.selectedRooms
      .map(
        (
          room,
        ) =>
          room.roomId,
      ),
  );

console.log(
  "\n=== ARCHITECTURE V2 FORMAL LOW POPULATION DESIGN V2 ===\n",
);

console.log(
  "Rule: preserve Medium room-count strata, then minimize weighted spatial coverage loss.",
);

console.log(
  "Simulation outcomes are not used in room selection.",
);

console.log(
  `LOW = ${LOW_OCCUPANCY}, MEDIUM = ${MEDIUM_OCCUPANCY}`,
);

console.log(
  "\n=== STRATUM QUOTAS ===\n",
);

console.table(
  strata.map(
    (
      stratum,
    ) => ({
      mediumOccupantsPerRoom:
        stratum.mediumCountPerRoom,

      numberOfRooms:
        stratum.rooms.length,

      lowRoomsSelected:
        stratum.proportionalLowCount,
    }),
  ),
);

console.log(
  "\n=== SELECTED LOW ROOMS ===\n",
);

console.table(
  rooms.map(
    (
      room,
    ) => ({
      roomId:
        room.roomId,

      mediumCount:
        room.mediumCount,

      selectedForLow:
        selectedRoomIds.has(
          room.roomId,
        ),

      centroidX:
        Number(
          room.centroid.x
            .toFixed(
              2,
            ),
        ),

      centroidY:
        Number(
          room.centroid.y
            .toFixed(
              2,
            ),
        ),
    }),
  ),
);

console.log(
  "\n=== SELECTED LOW OCCUPANTS ===\n",
);

console.table(
  selected.map(
    (
      record,
    ) => ({
      agentId:
        record.occupant.id,

      roomId:
        record.roomId,

      x:
        Number(
          record.occupant
            .spawnPosition.x
            .toFixed(
              3,
            ),
        ),

      y:
        Number(
          record.occupant
            .spawnPosition.y
            .toFixed(
              3,
            ),
        ),
    }),
  ),
);

const allSelectedExistInMedium =
  selected.every(
    (
      record,
    ) =>
      medium.scenario
        .occupants
        .some(
          (
            occupant,
          ) =>
            occupant.id ===
              record.occupant.id &&
            occupant.spawnPosition.x ===
              record.occupant
                .spawnPosition.x &&
            occupant.spawnPosition.y ===
              record.occupant
                .spawnPosition.y,
        ),
  );

const selectedStratumCounts =
  new Map<
    number,
    number
  >();

for (
  const room of
    solution.selectedRooms
) {
  selectedStratumCounts.set(
    room.mediumCount,
    (
      selectedStratumCounts.get(
        room.mediumCount,
      ) ??
      0
    ) +
      1,
  );
}

const strataCorrect =
  strata.every(
    (
      stratum,
    ) =>
      (
        selectedStratumCounts.get(
          stratum.mediumCountPerRoom,
        ) ??
        0
      ) ===
      stratum.proportionalLowCount,
  );

console.log(
  "\n=== LOW V2 VALIDATION ===\n",
);

console.table([
  {
    check:
      "Exactly 14 occupants selected",

    passed:
      selected.length ===
      LOW_OCCUPANCY,
  },

  {
    check:
      "Exactly 14 rooms represented",

    passed:
      selectedRoomIds.size ===
      LOW_OCCUPANCY,
  },

  {
    check:
      "Room-count stratum quotas preserved",

    passed:
      strataCorrect,
  },

  {
    check:
      "LOW positions are exact frozen Medium positions",

    passed:
      allSelectedExistInMedium,
  },

  {
    check:
      "Spawn-zone count equals LOW occupancy",

    passed:
      low.spawnZones
        .zones
        .length ===
      LOW_OCCUPANCY,
  },

  {
    check:
      "One room-origin node per LOW occupant",

    passed:
      low.graph
        .nodes
        .filter(
          (
            node,
          ) =>
            node.id.startsWith(
              "room-origin-agent-",
            ),
        )
        .length ===
      LOW_OCCUPANCY,
  },

  {
    check:
      "One room-origin edge per LOW occupant",

    passed:
      low.graph
        .edges
        .filter(
          (
            edge,
          ) =>
            edge.id.startsWith(
              "room-origin-edge-agent-",
            ),
        )
        .length ===
      LOW_OCCUPANCY,
  },
]);

console.log(
  "\nWeighted spatial coverage loss:",
  Number(
    solution.spatialCoverageLoss
      .toFixed(
        4,
      ),
  ),
);

console.log(
  "\n=== LOW V2 D0 SMOKE RUN ===\n",
);

console.table([
  {
    occupants:
      result.metrics
        .totalAgents,

    evacuated:
      result.metrics
        .evacuatedAgents,

    completionPercent:
      Number(
        (
          result.metrics
            .completionRate *
          100
        ).toFixed(
          1,
        ),
      ),

    totalEvacuationTimeSeconds:
      result.metrics
        .totalEvacuationTimeSeconds,

    p95Seconds:
      result.metrics
        .p95EvacuationTimeSeconds,

    maximumDensity:
      Number(
        result.metrics
          .maximumLocalDensityPersonsPerSquareMeter
          .toFixed(
            2,
          ),
      ),

    queueExposurePersonSeconds:
      Number(
        result.queueMetrics
          .populationQueueWaitPersonSeconds
          .toFixed(
            2,
          ),
      ),

    reroutes:
      result.metrics
        .totalReroutes,

    unreachable:
      result.metrics
        .unreachableAgents,

    timeouts:
      result.metrics
        .timeoutAgents,
  },
]);

console.log(
  "\n=== END LOW POPULATION DESIGN V2 ===\n",
);