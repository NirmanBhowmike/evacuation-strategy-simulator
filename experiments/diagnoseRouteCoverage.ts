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

const TARGET_EDGE_ID =
  "edge-main-central-main-mid";

const TARGET_ZONE_ID =
  "corridor-main-central-blockable";

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

function getAgentId(
  index: number,
): string {
  return `agent-${String(
    index + 1,
  ).padStart(
    4,
    "0",
  )}`;
}

function getOriginForAgent(
  agentId: string,
) {
  const match =
    /^agent-(\d+)$/.exec(
      agentId,
    );

  if (!match) {
    throw new Error(
      `Unexpected agent id: ${agentId}`,
    );
  }

  const ordinal =
    Number(
      match[1],
    );

  const index =
    ordinal - 1;

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

  const spawnZone =
    spawnZones[
      index %
      spawnZones.length
    ];

  if (!spawnZone) {
    throw new Error(
      `Unable to map ${agentId} to a spawn zone.`,
    );
  }

  return {
    spawnZoneId:
      spawnZone.id,

    accessNodeId:
      spawnZone.accessNodeId,
  };
}

function createScenario(
  strategyId:
    RoutingStrategyId,
  blockAtTimeZero:
    boolean,
): ScenarioInstance {
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

  return {
    id:
      blockAtTimeZero
        ? `route-coverage-${strategyId}-blocked-zero`
        : `route-coverage-${strategyId}-baseline`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "route-coverage-diagnostic-v1",

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
              getAgentId(
                index,
              ),

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
      blockAtTimeZero
        ? [
            {
              id:
                "block-target-at-zero",

              type:
                "CORRIDOR_BLOCK",

              activationTimeSeconds:
                0,

              targetId:
                TARGET_ZONE_ID,
            },
          ]
        : [],
  };
}

function runStrategy(
  strategyId:
    RoutingStrategyId,
  blockAtTimeZero:
    boolean,
) {
  return runHeadlessSimulation({
    scenario:
      createScenario(
        strategyId,
        blockAtTimeZero,
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

function roundMetric(
  value:
    number | null,
): number | null {
  return value ===
    null
    ? null
    : Number(
        value.toFixed(
          2,
        ),
      );
}

const baselineByStrategy =
  new Map<
    RoutingStrategyId,
    ReturnType<
      typeof runHeadlessSimulation
    >
  >();

const blockedZeroByStrategy =
  new Map<
    RoutingStrategyId,
    ReturnType<
      typeof runHeadlessSimulation
    >
  >();

console.log(
  "\nRunning baseline route-coverage diagnostic\n",
);

for (
  const strategy of
    STRATEGIES
) {
  console.log(
    `Baseline: ${strategy}`,
  );

  baselineByStrategy.set(
    strategy,
    runStrategy(
      strategy,
      false,
    ),
  );

  console.log(
    `Block at t=0: ${strategy}`,
  );

  blockedZeroByStrategy.set(
    strategy,
    runStrategy(
      strategy,
      true,
    ),
  );
}

// ============================================================
// 1. TARGET EDGE COVERAGE
// ============================================================

const targetCoverageRows =
  STRATEGIES.map(
    (
      strategy,
    ) => {
      const result =
        baselineByStrategy.get(
          strategy,
        );

      if (!result) {
        throw new Error(
          `Missing baseline result for ${strategy}`,
        );
      }

      const initialRoutes =
        result.decisionTrace.filter(
          (
            entry,
          ) =>
            entry.eventType ===
              "INITIAL_ROUTE" &&
            entry.action ===
              "ROUTE_ASSIGNED",
        );

      const users =
        initialRoutes.filter(
          (
            entry,
          ) =>
            entry.candidateEdgeIds
              .includes(
                TARGET_EDGE_ID,
              ),
        );

      const originNodes =
        [
          ...new Set(
            users.map(
              (
                entry,
              ) =>
                getOriginForAgent(
                  entry.agentId,
                )
                  .accessNodeId,
            ),
          ),
        ].sort();

      const exitTargets =
        [
          ...new Set(
            users.map(
              (
                entry,
              ) =>
                entry
                  .selectedTargetExitId ??
                "NONE",
            ),
          ),
        ].sort();

      return {
        strategy,

        initialRoutes:
          initialRoutes.length,

        targetEdgeUsers:
          users.length,

        targetEdgeShare:
          Number(
            (
              users.length /
              OCCUPANT_COUNT
            ).toFixed(
              3,
            ),
          ),

        accessNodesUsingEdge:
          originNodes.join(
            ", ",
          ) ||
          "NONE",

        targetExits:
          exitTargets.join(
            ", ",
          ) ||
          "NONE",
      };
    },
  );

console.log(
  "\n1. Baseline use of dedicated blockable edge\n",
);

console.table(
  targetCoverageRows,
);

// ============================================================
// 2. TIME-ZERO BLOCK RESPONSE
// ============================================================

const zeroBlockRows =
  STRATEGIES.map(
    (
      strategy,
    ) => {
      const baseline =
        baselineByStrategy.get(
          strategy,
        );

      const blocked =
        blockedZeroByStrategy.get(
          strategy,
        );

      if (
        !baseline ||
        !blocked
      ) {
        throw new Error(
          `Missing diagnostic result for ${strategy}`,
        );
      }

      const baselineTet =
        baseline.metrics
          .totalEvacuationTimeSeconds;

      const blockedTet =
        blocked.metrics
          .totalEvacuationTimeSeconds;

      const tetDelta =
        baselineTet !==
          null &&
        blockedTet !==
          null
          ? blockedTet -
            baselineTet
          : null;

      return {
        strategy,

        baselineTET:
          roundMetric(
            baselineTet,
          ),

        blockedAtZeroTET:
          roundMetric(
            blockedTet,
          ),

        tetDelta:
          roundMetric(
            tetDelta,
          ),

        blockedCompletion:
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

        exitChanges:
          blocked.routeStability
            .totalExitTargetChanges,

        reversals:
          blocked.routeStability
            .totalRouteReversalEvents,

        unreachable:
          blocked.metrics
            .unreachableAgents,

        timeout:
          blocked.metrics
            .timeoutAgents,
      };
    },
  );

console.log(
  "\n2. Effect of blocking dedicated segment at t = 0\n",
);

console.table(
  zeroBlockRows,
);

// ============================================================
// 3. BASELINE EDGE-USAGE RANKING
// ============================================================

interface EdgeUsage {
  edgeId: string;
  from: string;
  to: string;
  zoneId: string;

  counts:
    Record<
      RoutingStrategyId,
      number
    >;
}

const edgeUsage =
  new Map<
    string,
    EdgeUsage
  >();

for (
  const edge of
    layoutANavigationGraph.edges
) {
  edgeUsage.set(
    edge.id,
    {
      edgeId:
        edge.id,

      from:
        edge.from,

      to:
        edge.to,

      zoneId:
        edge.zoneId,

      counts: {
        NEAREST_EXIT:
          0,

        STATIC_SHORTEST_PATH:
          0,

        CONGESTION_AWARE:
          0,

        HAZARD_AWARE:
          0,

        ADAPTIVE_HYBRID:
          0,
      },
    },
  );
}

for (
  const strategy of
    STRATEGIES
) {
  const result =
    baselineByStrategy.get(
      strategy,
    );

  if (!result) {
    throw new Error(
      `Missing baseline result for ${strategy}`,
    );
  }

  const initialRoutes =
    result.decisionTrace.filter(
      (
        entry,
      ) =>
        entry.eventType ===
          "INITIAL_ROUTE" &&
        entry.action ===
          "ROUTE_ASSIGNED",
    );

  for (
    const route of
      initialRoutes
  ) {
    for (
      const edgeId of
        route.candidateEdgeIds
    ) {
      const usage =
        edgeUsage.get(
          edgeId,
        );

      if (!usage) {
        throw new Error(
          `Decision Trace references unknown edge: ${edgeId}`,
        );
      }

      usage.counts[
        strategy
      ] += 1;
    }
  }
}

const rankedEdgeUsage =
  [
    ...edgeUsage.values(),
  ]
    .map(
      (
        usage,
      ) => {
        const total =
          STRATEGIES.reduce(
            (
              sum,
              strategy,
            ) =>
              sum +
              usage.counts[
                strategy
              ],
            0,
          );

        return {
          edge:
            usage.edgeId,

          from:
            usage.from,

          to:
            usage.to,

          zone:
            usage.zoneId,

          nearest:
            usage.counts
              .NEAREST_EXIT,

          static:
            usage.counts
              .STATIC_SHORTEST_PATH,

          congestion:
            usage.counts
              .CONGESTION_AWARE,

          hazard:
            usage.counts
              .HAZARD_AWARE,

          adaptive:
            usage.counts
              .ADAPTIVE_HYBRID,

          totalUsers:
            total,
        };
      },
    )
    .filter(
      (
        row,
      ) =>
        row.totalUsers >
        0,
    )
    .sort(
      (
        first,
        second,
      ) =>
        second.totalUsers -
        first.totalUsers ||
        first.edge.localeCompare(
          second.edge,
        ),
    );

console.log(
  "\n3. Baseline initial-route edge usage, ranked by total users\n",
);

console.table(
  rankedEdgeUsage,
);

// ============================================================
// 4. UNIQUE ROUTE PATTERNS BY SPAWN ORIGIN
// ============================================================

const routePatterns =
  new Map<
    string,
    {
      strategy:
        RoutingStrategyId;

      spawnZone:
        string;

      accessNode:
        string;

      selectedExit:
        string;

      usesTargetEdge:
        boolean;

      route:
        string;
    }
  >();

for (
  const strategy of
    STRATEGIES
) {
  const result =
    baselineByStrategy.get(
      strategy,
    );

  if (!result) {
    throw new Error(
      `Missing baseline result for ${strategy}`,
    );
  }

  for (
    const entry of
      result.decisionTrace
  ) {
    if (
      entry.eventType !==
        "INITIAL_ROUTE" ||
      entry.action !==
        "ROUTE_ASSIGNED"
    ) {
      continue;
    }

    const origin =
      getOriginForAgent(
        entry.agentId,
      );

    const route =
      entry.candidateEdgeIds
        .join(
          " -> ",
        );

    const key =
      [
        strategy,
        origin.spawnZoneId,
        entry
          .selectedTargetExitId,
        route,
      ].join(
        "|",
      );

    if (
      !routePatterns.has(
        key,
      )
    ) {
      routePatterns.set(
        key,
        {
          strategy,

          spawnZone:
            origin
              .spawnZoneId,

          accessNode:
            origin
              .accessNodeId,

          selectedExit:
            entry
              .selectedTargetExitId ??
            "NONE",

          usesTargetEdge:
            entry
              .candidateEdgeIds
              .includes(
                TARGET_EDGE_ID,
              ),

          route,
        },
      );
    }
  }
}

console.log(
  "\n4. Unique baseline route patterns by spawn origin\n",
);

console.table(
  [
    ...routePatterns
      .values(),
  ],
);