import {
  createArchitectureV2AuthoritativeBundle,
} from "../src/app/createArchitectureV2DemoReplay";

import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

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

interface RoomAllocationRecord {
  readonly roomId:
    string;

  readonly mediumCount:
    number;

  readonly idealLowCount:
    number;

  readonly floorLowCount:
    number;

  readonly remainder:
    number;

  readonly finalLowCount:
    number;
}

const LOW_OCCUPANCY =
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY
    .LOW;

const MEDIUM_OCCUPANCY =
  ARCHITECTURE_V2_RESEARCH_OCCUPANCY
    .MEDIUM;

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

/**
 * Determines how many LOW occupants should be retained
 * from each room.
 *
 * The LOW population is treated as a stratified
 * down-sample of the frozen 42-person Medium population.
 *
 * Ideal room count:
 *
 * mediumRoomCount * LOW / MEDIUM
 *
 * Integer allocation uses the largest-remainder method.
 *
 * This preserves the Medium room distribution as closely
 * as possible while producing exactly 14 occupants.
 */
function createLowRoomAllocations(
  records:
    readonly MediumOccupantRecord[],
): readonly RoomAllocationRecord[] {
  const mediumCounts =
    new Map<
      string,
      number
    >();

  for (
    const record of
      records
  ) {
    mediumCounts.set(
      record.roomId,
      (
        mediumCounts.get(
          record.roomId,
        ) ??
        0
      ) +
        1,
    );
  }

  const preliminary =
    [
      ...mediumCounts
        .entries(),
    ]
      .map(
        (
          [
            roomId,
            mediumCount,
          ],
        ) => {
          const idealLowCount =
            mediumCount *
            LOW_OCCUPANCY /
            MEDIUM_OCCUPANCY;

          const floorLowCount =
            Math.floor(
              idealLowCount,
            );

          return {
            roomId,

            mediumCount,

            idealLowCount,

            floorLowCount,

            remainder:
              idealLowCount -
              floorLowCount,
          };
        },
      );

  const floorTotal =
    preliminary.reduce(
      (
        sum,
        record,
      ) =>
        sum +
        record.floorLowCount,
      0,
    );

  let remaining =
    LOW_OCCUPANCY -
    floorTotal;

  if (
    remaining <
    0
  ) {
    throw new Error(
      "LOW room allocation floor total exceeds target occupancy.",
    );
  }

  /**
   * Largest fractional remainder receives the next slot.
   *
   * Tie-breaks:
   *
   * 1. larger Medium room count
   * 2. room ID
   *
   * This keeps the process deterministic.
   */
  const ranked =
    [
      ...preliminary,
    ]
      .sort(
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

          if (
            second.mediumCount !==
            first.mediumCount
          ) {
            return (
              second.mediumCount -
              first.mediumCount
            );
          }

          return first.roomId
            .localeCompare(
              second.roomId,
            );
        },
      );

  const extraRooms =
    new Set<
      string
    >();

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
        index
      ];

    if (!selected) {
      throw new Error(
        "Unable to complete LOW room allocation.",
      );
    }

    extraRooms.add(
      selected.roomId,
    );
  }

  const allocations =
    preliminary
      .map(
        (
          record,
        ) => {
          const finalLowCount =
            record.floorLowCount +
            (
              extraRooms.has(
                record.roomId,
              )
                ? 1
                : 0
            );

          if (
            finalLowCount >
            record.mediumCount
          ) {
            throw new Error(
              `LOW allocation for ${record.roomId} exceeds the available Medium population.`,
            );
          }

          return {
            ...record,

            finalLowCount,
          };
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.roomId
            .localeCompare(
              second.roomId,
            ),
      );

  const finalTotal =
    allocations.reduce(
      (
        sum,
        record,
      ) =>
        sum +
        record.finalLowCount,
      0,
    );

  if (
    finalTotal !==
    LOW_OCCUPANCY
  ) {
    throw new Error(
      `LOW allocation produced ${finalTotal} occupants instead of ${LOW_OCCUPANCY}.`,
    );
  }

  return allocations;
}

/**
 * Selects n occupants from one room while spreading the
 * retained positions across the room's existing Medium
 * occupant sequence.
 *
 * Every selected LOW occupant therefore corresponds to
 * an actual frozen Medium occupant position.
 */
function selectEvenlyFromRoom(
  records:
    readonly MediumOccupantRecord[],
  targetCount:
    number,
): readonly MediumOccupantRecord[] {
  if (
    targetCount ===
    0
  ) {
    return [];
  }

  if (
    targetCount >
    records.length
  ) {
    throw new Error(
      "Requested LOW room sample exceeds available Medium occupants.",
    );
  }

  if (
    targetCount ===
    records.length
  ) {
    return [
      ...records,
    ];
  }

  const selected:
    MediumOccupantRecord[] =
  [];

  const selectedIndices =
    new Set<
      number
    >();

  for (
    let sampleIndex =
      0;
    sampleIndex <
      targetCount;
    sampleIndex +=
      1
  ) {
    const sourceIndex =
      Math.floor(
        (
          (
            sampleIndex +
            0.5
          ) *
          records.length
        ) /
        targetCount,
      );

    if (
      sourceIndex <
        0 ||
      sourceIndex >=
        records.length
    ) {
      throw new Error(
        "Calculated LOW sample index is outside the room population.",
      );
    }

    if (
      selectedIndices.has(
        sourceIndex,
      )
    ) {
      throw new Error(
        "LOW room sampling produced a duplicate source index.",
      );
    }

    selectedIndices.add(
      sourceIndex,
    );

    const selectedRecord =
      records[
        sourceIndex
      ];

    if (!selectedRecord) {
      throw new Error(
        "Unable to retrieve LOW room sample.",
      );
    }

    selected.push(
      selectedRecord,
    );
  }

  return selected;
}

function selectLowPopulation(
  records:
    readonly MediumOccupantRecord[],
  allocations:
    readonly RoomAllocationRecord[],
): readonly MediumOccupantRecord[] {
  const byRoom =
    new Map<
      string,
      MediumOccupantRecord[]
    >();

  for (
    const record of
      records
  ) {
    const existing =
      byRoom.get(
        record.roomId,
      ) ??
      [];

    existing.push(
      record,
    );

    byRoom.set(
      record.roomId,
      existing,
    );
  }

  const selected:
    MediumOccupantRecord[] =
  [];

  for (
    const allocation of
      allocations
  ) {
    if (
      allocation.finalLowCount ===
      0
    ) {
      continue;
    }

    const roomRecords =
      byRoom.get(
        allocation.roomId,
      );

    if (!roomRecords) {
      throw new Error(
        `Medium room population not found: ${allocation.roomId}`,
      );
    }

    selected.push(
      ...selectEvenlyFromRoom(
        roomRecords,
        allocation.finalLowCount,
      ),
    );
  }

  selected.sort(
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
      `LOW population selection produced ${selected.length} occupants instead of ${LOW_OCCUPANCY}.`,
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
      "layout-a-v2-low-14-d0-population-design",

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

  const graph = {
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

  const spawnZones = {
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

  return {
    scenario,
    graph,
    spawnZones,
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

const mediumRecords =
  requireMediumOccupantRecords(
    medium,
  );

const allocations =
  createLowRoomAllocations(
    mediumRecords,
  );

const selected =
  selectLowPopulation(
    mediumRecords,
    allocations,
  );

const low =
  createLowBundle(
    medium,
    selected,
  );

const lowResult =
  runLowBaseline(
    low,
  );

console.log(
  "\n=== ARCHITECTURE V2 FORMAL LOW POPULATION DESIGN ===\n",
);

console.log(
  `LOW target: ${LOW_OCCUPANCY}`,
);

console.log(
  `MEDIUM source population: ${MEDIUM_OCCUPANCY}`,
);

console.log(
  "Method: deterministic stratified down-sample of the frozen Medium population",
);

console.log(
  "\n=== ROOM ALLOCATION ===\n",
);

console.table(
  allocations.map(
    (
      allocation,
    ) => ({
      roomId:
        allocation.roomId,

      mediumCount:
        allocation.mediumCount,

      idealLowCount:
        Number(
          allocation
            .idealLowCount
            .toFixed(
              3,
            ),
        ),

      lowCount:
        allocation.finalLowCount,
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
          record
            .occupant
            .spawnPosition
            .x
            .toFixed(
              3,
            ),
        ),

      y:
        Number(
          record
            .occupant
            .spawnPosition
            .y
            .toFixed(
              3,
            ),
        ),
    }),
  ),
);

const selectedRooms =
  new Set(
    selected.map(
      (
        record,
      ) =>
        record.roomId,
    ),
  );

const uniqueAgentIds =
  new Set(
    selected.map(
      (
        record,
      ) =>
        record.occupant.id,
    ),
  );

const everySelectedAgentExistsInMedium =
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
              .spawnPosition
              .x &&
            occupant.spawnPosition.y ===
            record.occupant
              .spawnPosition
              .y,
        ),
  );

console.log(
  "\n=== LOW POPULATION VALIDATION ===\n",
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
      "All selected IDs unique",

    passed:
      uniqueAgentIds.size ===
      LOW_OCCUPANCY,
  },

  {
    check:
      "LOW is a spatial subset of frozen Medium",

    passed:
      everySelectedAgentExistsInMedium,
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
      "One room-origin node retained per LOW occupant",

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
      "One room-origin edge retained per LOW occupant",

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
  `\nRooms represented in LOW: ${selectedRooms.size}`,
);

console.log(
  "\n=== LOW D0 SMOKE RUN ===\n",
);

console.table([
  {
    occupants:
      lowResult.metrics
        .totalAgents,

    evacuated:
      lowResult.metrics
        .evacuatedAgents,

    completionPercent:
      Number(
        (
          lowResult.metrics
            .completionRate *
          100
        ).toFixed(
          1,
        ),
      ),

    totalEvacuationTimeSeconds:
      lowResult.metrics
        .totalEvacuationTimeSeconds,

    p95Seconds:
      lowResult.metrics
        .p95EvacuationTimeSeconds,

    maximumDensity:
      Number(
        lowResult.metrics
          .maximumLocalDensityPersonsPerSquareMeter
          .toFixed(
            2,
          ),
      ),

    queueExposurePersonSeconds:
      Number(
        lowResult.queueMetrics
          .populationQueueWaitPersonSeconds
          .toFixed(
            2,
          ),
      ),

    reroutes:
      lowResult.metrics
        .totalReroutes,

    unreachable:
      lowResult.metrics
        .unreachableAgents,

    timeouts:
      lowResult.metrics
        .timeoutAgents,
  },
]);

console.log(
  "\n=== END FORMAL LOW POPULATION DESIGN ===\n",
);