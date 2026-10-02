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

const BLOCK_TIME_SECONDS =
  13.25;

const STRATEGIES:
  readonly RoutingStrategyId[] =
[
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
];

const CORRIDOR_TARGETS =
[
  "corridor-west-central",
  "corridor-main-spine",
  "corridor-east-vertical",
  "corridor-far-east",
  "corridor-east-bottleneck",
] as const;

function polygonCenter(
  zone: SpawnZone,
): Position2D {
  const vertices =
    zone.polygon.vertices;

  if (
    vertices.length === 0
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

function createScenario(
  corridorTarget:
    string | null,
): ScenarioInstance {
  const spawnZones =
    layoutASpawnZones.zones;

  return {
    id:
      corridorTarget ===
      null
        ? "corridor-target-baseline"
        : `corridor-target-${corridorTarget}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "corridor-target-calibration-v1",

    occupants:
      Array.from(
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
      ),

    disruptionSchedule:
      corridorTarget ===
      null
        ? []
        : [
            {
              id:
                `block-${corridorTarget}`,

              type:
                "CORRIDOR_BLOCK",

              activationTimeSeconds:
                BLOCK_TIME_SECONDS,

              targetId:
                corridorTarget,
            },
          ],
  };
}

function runCase(
  strategyId:
    RoutingStrategyId,
  target:
    string | null,
) {
  const result =
    runHeadlessSimulation({
      scenario:
        createScenario(
          target,
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

  return {
    strategy:
      strategyId,

    corridor:
      target ??
      "BASELINE",

    completionRate:
      Number(
        result.metrics
          .completionRate
          .toFixed(
            3,
          ),
      ),

    totalEvacuationTime:
      result.metrics
        .totalEvacuationTimeSeconds ===
      null
        ? null
        : Number(
            result.metrics
              .totalEvacuationTimeSeconds
              .toFixed(
                2,
              ),
          ),

    p95:
      result.metrics
        .p95EvacuationTimeSeconds ===
      null
        ? null
        : Number(
            result.metrics
              .p95EvacuationTimeSeconds
              .toFixed(
                2,
              ),
          ),

    maximumDensity:
      result.metrics
        .maximumLocalDensityPersonsPerSquareMeter ===
      null
        ? null
        : Number(
            result.metrics
              .maximumLocalDensityPersonsPerSquareMeter
              .toFixed(
                3,
              ),
          ),

    queueExposure:
      Number(
        result.queueMetrics
          .populationQueueWaitPersonSeconds
          .toFixed(
            2,
          ),
      ),

    reroutes:
      result.routeStability
        .acceptedReroutes,

    exitChanges:
      result.routeStability
        .exitTargetChanges,

    reversals:
      result.routeStability
        .routeReversals,

    unreachable:
      result.metrics
        .unreachableAgents,

    timeout:
      result.metrics
        .timeoutAgents,
  };
}

const results = [];

for (
  const strategy of
    STRATEGIES
) {
  console.log(
    `Running baseline: ${strategy}`,
  );

  results.push(
    runCase(
      strategy,
      null,
    ),
  );

  for (
    const corridor of
      CORRIDOR_TARGETS
  ) {
    console.log(
      `Running ${strategy} with ${corridor} blocked`,
    );

    results.push(
      runCase(
        strategy,
        corridor,
      ),
    );
  }
}

console.log(
  "\nCorridor-block target calibration\n",
);

console.log(
  `Occupancy: ${OCCUPANT_COUNT}`,
);

console.log(
  `Block time: ${BLOCK_TIME_SECONDS} s\n`,
);

console.table(
  results,
);