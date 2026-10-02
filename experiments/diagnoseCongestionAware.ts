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
    vertices.length === 0
  ) {
    throw new Error(
      `Spawn zone ${zone.id} has no vertices.`,
    );
  }

  const sum =
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
      sum.x /
      vertices.length,

    y:
      sum.y /
      vertices.length,
  };
}

function createScenario():
  ScenarioInstance {
  const spawnZones =
    layoutASpawnZones.zones;

  return {
    id:
      "congestion-aware-diagnostic",

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "congestion-diagnostic-v1",

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

    disruptionSchedule: [],
  };
}

function runStrategy(
  strategyId:
    RoutingStrategyId,
  maximumSimulationTimeSeconds:
    number,
) {
  return runHeadlessSimulation({
    scenario:
      createScenario(),

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

      maximumSimulationTimeSeconds,

      densityCellLengthMeters:
        1,

      specificFlowPersonsPerMeterSecond:
        1.3,

      adaptiveRerouteThreshold:
        0.20,
    },
  });
}

console.log(
  "\nBaseline strategy diagnostic\n",
);

const baselineRows =
  STRATEGIES.map(
    (
      strategy,
    ) => {
      const result =
        runStrategy(
          strategy,
          180,
        );

      return {
        strategy,

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

        queueExposure:
          Number(
            result.queueMetrics
              .populationQueueWaitPersonSeconds
              .toFixed(
                2,
              ),
          ),

        acceptedReroutes:
          result.routeStability
            .totalAcceptedReroutes,

        exitTargetChanges:
          result.routeStability
            .totalExitTargetChanges,

        routeReversals:
          result.routeStability
            .totalRouteReversalEvents,

        agentsRerouted:
          result.routeStability
            .agentsWithAcceptedReroutes,

        unreachable:
          result.metrics
            .unreachableAgents,

        timeout:
          result.metrics
            .timeoutAgents,
      };
    },
  );

console.table(
  baselineRows,
);

console.log(
  "\nCongestion-Aware runtime-horizon diagnostic\n",
);

const horizons =
[
  60,
  180,
  600,
] as const;

const horizonRows =
  horizons.map(
    (
      horizon,
    ) => {
      const result =
        runStrategy(
          "CONGESTION_AWARE",
          horizon,
        );

      return {
        runtimeCeiling:
          horizon,

        completionRate:
          Number(
            result.metrics
              .completionRate
              .toFixed(
                3,
              ),
          ),

        simulatedTime:
          result
            .simulatedTimeSeconds,

        queueExposure:
          Number(
            result.queueMetrics
              .populationQueueWaitPersonSeconds
              .toFixed(
                2,
              ),
          ),

        acceptedReroutes:
          result.routeStability
            .totalAcceptedReroutes,

        exitTargetChanges:
          result.routeStability
            .totalExitTargetChanges,

        routeReversals:
          result.routeStability
            .totalRouteReversalEvents,

        timeout:
          result.metrics
            .timeoutAgents,
      };
    },
  );

console.table(
  horizonRows,
);

const diagnostic =
  runStrategy(
    "CONGESTION_AWARE",
    180,
  );

console.log(
  "\nCongestion-Aware route stability by agent\n",
);

console.table(
  diagnostic
    .routeStability
    .byAgent
    .map(
      (
        row,
      ) => ({
        agent:
          row.agentId,

        reroutes:
          row.acceptedReroutes,

        exitChanges:
          row.exitTargetChanges,

        reversals:
          row.routeReversalEvents,
      }),
    )
    .sort(
      (
        first,
        second,
      ) =>
        second.reroutes -
        first.reroutes,
    ),
);

console.log(
  "\nCongestion-Aware unresolved agents\n",
);

console.table(
  diagnostic
    .finalAgents
    .filter(
      (
        agent,
      ) =>
        agent.status !==
        "EVACUATED",
    )
    .map(
      (
        agent,
      ) => ({
        agent:
          agent.id,

        status:
          agent.status,

        currentNode:
          agent.currentNodeId,

        currentEdge:
          agent.currentEdgeId,

        targetExit:
          agent.targetExitId,

        rerouteCount:
          agent.rerouteCount,

        routeCursor:
          agent.routeCursorIndex,

        distanceTraveled:
          Number(
            agent
              .distanceTraveledMeters
              .toFixed(
                2,
              ),
          ),
      }),
    ),
);