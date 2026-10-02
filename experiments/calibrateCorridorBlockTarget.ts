import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  layoutA,
} from "../src/environment/layoutA";
import {
  layoutAExits,
} from "../src/environment/layoutAExits";
import {
  layoutANavigationGraph,
} from "../src/environment/layoutANavigationGraph";
import {
  layoutASpawnZones,
} from "../src/environment/layoutASpawnZones";

import type {
  Position2D,
  ScenarioInstance,
} from "../src/types/scenario";
import type {
  RoutingStrategyId,
} from "../src/types/routingStrategy";
import type {
  SpawnZone,
} from "../src/types/spawn";

const OCCUPANT_COUNT =
  36;

const BLOCKABLE_ZONE =
  "corridor-main-east-blockable";

const BLOCK_TIME_SECONDS =
  6.65;

const STRATEGIES:
  readonly RoutingStrategyId[] =
[
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
];

function polygonCenter(
  zone: SpawnZone,
): Position2D {
  const vertices =
    zone.polygon.vertices;

  if (
    vertices.length ===
    0
  ) {
    throw new Error(
      `Spawn zone ${zone.id} has no vertices.`,
    );
  }

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

function createOccupants() {
  const spawnZones =
    layoutASpawnZones.zones;

  if (
    spawnZones.length ===
    0
  ) {
    throw new Error(
      "Layout A requires spawn zones.",
    );
  }

  return Array.from(
    {
      length:
        OCCUPANT_COUNT,
    },
    (
      _,
      index,
    ) => {
      const spawnZone =
        spawnZones[
          index %
          spawnZones.length
        ];

      if (!spawnZone) {
        throw new Error(
          "Unable to select Layout A spawn zone.",
        );
      }

      return {
        id:
          `agent-${String(
            index + 1,
          ).padStart(
            4,
            "0",
          )}`,

        spawnPosition:
          polygonCenter(
            spawnZone,
          ),

        desiredSpeedMps:
          1.34,
      };
    },
  );
}

function createScenario(
  strategyId:
    RoutingStrategyId,
  blocked:
    boolean,
): ScenarioInstance {
  return {
    id:
      blocked
        ? `permanent-corridor-block-${strategyId}`
        : `permanent-corridor-baseline-${strategyId}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "corridor-block-permanent-v1",

    occupants:
      createOccupants(),

    disruptionSchedule:
      blocked
        ? [
            {
              id:
                "block-main-east-segment",

              type:
                "CORRIDOR_BLOCK",

              activationTimeSeconds:
                BLOCK_TIME_SECONDS,

              targetId:
                BLOCKABLE_ZONE,
            },
          ]
        : [],
  };
}

function runCase(
  strategyId:
    RoutingStrategyId,
  blocked:
    boolean,
) {
  return runHeadlessSimulation({
    scenario:
      createScenario(
        strategyId,
        blocked,
      ),

    environment:
      layoutA,

    graph:
      layoutANavigationGraph,

    exits:
      layoutAExits,

    spawnZones:
      layoutASpawnZones,

    configuration: {
      strategyId,

      timestepSeconds:
        0.05,

      maximumSimulationTimeSeconds:
        180,

      densityCellLengthMeters:
        1,

      specificFlowPersonsPerMeterSecond:
        1.3,

      adaptiveRerouteThreshold:
        0.20,
    },
  });
}

const rows = [];

for (
  const strategyId of
    STRATEGIES
) {
  console.log(
    `Running baseline: ${strategyId}`,
  );

  const baseline =
    runCase(
      strategyId,
      false,
    );

  console.log(
    `Running corridor block: ${strategyId}`,
  );

  const blocked =
    runCase(
      strategyId,
      true,
    );

  const baselineTet =
    baseline.metrics
      .totalEvacuationTimeSeconds;

  const blockedTet =
    blocked.metrics
      .totalEvacuationTimeSeconds;

  rows.push({
    strategy:
      strategyId,

    baselineTET:
      baselineTet,

    blockedTET:
      blockedTet,

    tetDelta:
      baselineTet !==
        null &&
      blockedTet !==
        null
        ? Number(
            (
              blockedTet -
              baselineTet
            ).toFixed(
              2,
            ),
          )
        : null,

    completionRate:
      Number(
        blocked.metrics
          .completionRate
          .toFixed(
            3,
          ),
      ),

    queueExposure:
      Number(
        blocked.queueMetrics
          .populationQueueWaitPersonSeconds
          .toFixed(
            2,
          ),
      ),

    acceptedReroutes:
      blocked.routeStability
        .totalAcceptedReroutes,

    exitTargetChanges:
      blocked.routeStability
        .totalExitTargetChanges,

    routeReversals:
      blocked.routeStability
        .totalRouteReversalEvents,

    unreachable:
      blocked.metrics
        .unreachableAgents,

    timeout:
      blocked.metrics
        .timeoutAgents,
  });
}

console.log(
  "\nPermanent Layout A corridor-block verification\n",
);

console.log(
  `Target zone: ${BLOCKABLE_ZONE}`,
);

console.log(
  "Target edge: edge-main-east-end",
);

console.log(
  `Activation time: ${BLOCK_TIME_SECONDS} s`,
);

console.log(
  `Occupancy: ${OCCUPANT_COUNT}\n`,
);

console.table(
  rows,
);