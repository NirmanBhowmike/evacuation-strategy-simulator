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
  BuildingEnvironment,
  BuildingZone,
  Polygon2D,
} from "../src/types/environment";
import type {
  NavigationEdge,
  NavigationGraph,
} from "../src/types/navigation";
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

const EARLY_TIME =
  6.65;

const MID_TIME =
  13.25;

const LATE_TIME =
  19.90;

const STRATEGIES:
  readonly RoutingStrategyId[] =
[
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
];

const CANDIDATE_EDGE_IDS =
[
  "edge-main-to-far-east",
  "edge-main-east-end",
  "edge-east-lower-main",
  "edge-upper-east",
  "edge-atrium-main",
  "edge-west-atrium",
] as const;

interface TimingCase {
  readonly label:
    "EARLY" |
    "MID" |
    "LATE";

  readonly timeSeconds:
    number;
}

const TIMINGS:
  readonly TimingCase[] =
[
  {
    label:
      "EARLY",

    timeSeconds:
      EARLY_TIME,
  },

  {
    label:
      "MID",

    timeSeconds:
      MID_TIME,
  },

  {
    label:
      "LATE",

    timeSeconds:
      LATE_TIME,
  },
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

function getEdge(
  edgeId: string,
): NavigationEdge {
  const edge =
    layoutANavigationGraph
      .edges
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          edgeId,
      );

  if (!edge) {
    throw new Error(
      `Unknown candidate edge: ${edgeId}`,
    );
  }

  return edge;
}

function getNodePosition(
  nodeId: string,
): Position2D {
  const node =
    layoutANavigationGraph
      .nodes
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          nodeId,
      );

  if (!node) {
    throw new Error(
      `Unknown node: ${nodeId}`,
    );
  }

  return node.position;
}

/**
 * Creates a small positive-area polygon around the candidate
 * navigation edge.
 *
 * This is calibration-only geometry. It lets CORRIDOR_BLOCK
 * address exactly one edge without permanently editing Layout A.
 */
function createOverlayPolygon(
  edge:
    NavigationEdge,
): Polygon2D {
  const from =
    getNodePosition(
      edge.from,
    );

  const to =
    getNodePosition(
      edge.to,
    );

  const padding =
    0.25;

  const minimumDimension =
    0.5;

  const left =
    Math.max(
      0,
      Math.min(
        from.x,
        to.x,
      ) -
        padding,
    );

  const right =
    Math.min(
      layoutA.widthMeters,
      Math.max(
        from.x,
        to.x,
      ) +
        padding,
    );

  const bottom =
    Math.max(
      0,
      Math.min(
        from.y,
        to.y,
      ) -
        padding,
    );

  const top =
    Math.min(
      layoutA.heightMeters,
      Math.max(
        from.y,
        to.y,
      ) +
        padding,
    );

  const width =
    Math.max(
      right -
        left,
      minimumDimension,
    );

  const height =
    Math.max(
      top -
        bottom,
      minimumDimension,
    );

  return {
    vertices: [
      {
        x:
          left,
        y:
          bottom,
      },

      {
        x:
          Math.min(
            layoutA.widthMeters,
            left +
              width,
          ),

        y:
          bottom,
      },

      {
        x:
          Math.min(
            layoutA.widthMeters,
            left +
              width,
          ),

        y:
          Math.min(
            layoutA.heightMeters,
            bottom +
              height,
          ),
      },

      {
        x:
          left,

        y:
          Math.min(
            layoutA.heightMeters,
            bottom +
              height,
          ),
      },
    ],
  };
}

function createCandidateModel(
  edgeId: string,
): {
  environment:
    BuildingEnvironment;

  graph:
    NavigationGraph;

  disruptionZoneId:
    string;
} {
  const targetEdge =
    getEdge(
      edgeId,
    );

  const disruptionZoneId =
    `calibration-block-${edgeId}`;

  const disruptionZone:
    BuildingZone = {
    id:
      disruptionZoneId,

    type:
      "CORRIDOR",

    polygon:
      createOverlayPolygon(
        targetEdge,
      ),
  };

  const environment:
    BuildingEnvironment = {
    ...layoutA,

    zones: [
      ...layoutA.zones,
      disruptionZone,
    ],
  };

  const graph:
    NavigationGraph = {
    ...layoutANavigationGraph,

    nodes: [
      ...layoutANavigationGraph
        .nodes,
    ],

    edges:
      layoutANavigationGraph
        .edges
        .map(
          (
            edge,
          ) =>
            edge.id ===
            edgeId
              ? {
                  ...edge,

                  zoneId:
                    disruptionZoneId,
                }
              : {
                  ...edge,
                },
        ),
  };

  return {
    environment,
    graph,
    disruptionZoneId,
  };
}

function createBaselineScenario(
  strategyId:
    RoutingStrategyId,
): ScenarioInstance {
  return {
    id:
      `candidate-baseline-${strategyId}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "blockable-edge-candidate-calibration-v1",

    occupants:
      createOccupants(),

    disruptionSchedule:
      [],
  };
}

function createBlockedScenario(
  strategyId:
    RoutingStrategyId,
  edgeId:
    string,
  disruptionZoneId:
    string,
  timing:
    TimingCase,
): ScenarioInstance {
  return {
    id:
      `candidate-${edgeId}-${strategyId}-${timing.label}`,

    seed:
      1042,

    layoutId:
      "layout-a",

    parameterSetVersion:
      "blockable-edge-candidate-calibration-v1",

    occupants:
      createOccupants(),

    disruptionSchedule: [
      {
        id:
          `block-${edgeId}-${timing.label.toLowerCase()}`,

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          timing
            .timeSeconds,

        targetId:
          disruptionZoneId,
      },
    ],
  };
}

function runSimulation(
  scenario:
    ScenarioInstance,
  environment:
    BuildingEnvironment,
  graph:
    NavigationGraph,
  strategyId:
    RoutingStrategyId,
) {
  return runHeadlessSimulation({
    scenario,

    environment,

    graph,

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

function round(
  value:
    number,
): number {
  return Number(
    value.toFixed(
      2,
    ),
  );
}

function roundNullable(
  value:
    number | null,
): number | null {
  return value ===
    null
    ? null
    : round(
        value,
      );
}

const baselineByStrategy =
  new Map<
    RoutingStrategyId,
    ReturnType<
      typeof runHeadlessSimulation
    >
  >();

console.log(
  "\nRunning baseline cases\n",
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
    runSimulation(
      createBaselineScenario(
        strategy,
      ),
      layoutA,
      layoutANavigationGraph,
      strategy,
    ),
  );
}

const detailRows:
  {
    edge:
      string;

    timing:
      string;

    strategy:
      RoutingStrategyId;

    baselineTET:
      number | null;

    blockedTET:
      number | null;

    tetDelta:
      number | null;

    completion:
      number;

    queueExposure:
      number;

    reroutes:
      number;

    exitChanges:
      number;

    reversals:
      number;

    unreachable:
      number;

    timeout:
      number;

    changed:
      boolean;
  }[] = [];

console.log(
  "\nRunning candidate edge cases\n",
);

for (
  const edgeId of
    CANDIDATE_EDGE_IDS
) {
  const {
    environment,
    graph,
    disruptionZoneId,
  } =
    createCandidateModel(
      edgeId,
    );

  for (
    const timing of
      TIMINGS
  ) {
    for (
      const strategy of
        STRATEGIES
    ) {
      console.log(
        `${edgeId} - ${timing.label} - ${strategy}`,
      );

      const baseline =
        baselineByStrategy.get(
          strategy,
        );

      if (!baseline) {
        throw new Error(
          `Missing baseline for ${strategy}`,
        );
      }

      const blocked =
        runSimulation(
          createBlockedScenario(
            strategy,
            edgeId,
            disruptionZoneId,
            timing,
          ),
          environment,
          graph,
          strategy,
        );

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

      const queueDelta =
        blocked.queueMetrics
          .populationQueueWaitPersonSeconds -
        baseline.queueMetrics
          .populationQueueWaitPersonSeconds;

      const changed =
        (
          tetDelta !==
            null &&
          Math.abs(
            tetDelta,
          ) >
            0.05
        ) ||
        Math.abs(
          queueDelta,
        ) >
          0.05 ||
        blocked.metrics
          .completionRate !==
          baseline.metrics
            .completionRate ||
        blocked.routeStability
          .totalAcceptedReroutes !==
          baseline.routeStability
            .totalAcceptedReroutes;

      detailRows.push({
        edge:
          edgeId,

        timing:
          timing.label,

        strategy,

        baselineTET:
          roundNullable(
            baselineTet,
          ),

        blockedTET:
          roundNullable(
            blockedTet,
          ),

        tetDelta:
          roundNullable(
            tetDelta,
          ),

        completion:
          Number(
            blocked.metrics
              .completionRate
              .toFixed(
                3,
              ),
          ),

        queueExposure:
          round(
            blocked.queueMetrics
              .populationQueueWaitPersonSeconds,
          ),

        reroutes:
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

        changed,
      });
    }
  }
}

// ============================================================
// AGGREGATE CANDIDATE SUMMARY
// ============================================================

const summaryRows = [];

for (
  const edgeId of
    CANDIDATE_EDGE_IDS
) {
  for (
    const timing of
      TIMINGS
  ) {
    const matching =
      detailRows.filter(
        (
          row,
        ) =>
          row.edge ===
            edgeId &&
          row.timing ===
            timing.label,
      );

    const validDeltas =
      matching
        .map(
          (
            row,
          ) =>
            row.tetDelta,
        )
        .filter(
          (
            value,
          ):
            value is number =>
              value !==
              null,
        );

    const affectedStrategies =
      matching.filter(
        (
          row,
        ) =>
          row.changed,
      ).length;

    const maximumTetDelta =
      validDeltas.length ===
      0
        ? null
        : Math.max(
            ...validDeltas,
          );

    const meanTetDelta =
      validDeltas.length ===
      0
        ? null
        : validDeltas.reduce(
            (
              sum,
              value,
            ) =>
              sum +
              value,
            0,
          ) /
          validDeltas.length;

    summaryRows.push({
      edge:
        edgeId,

      timing:
        timing.label,

      timeSeconds:
        timing
          .timeSeconds,

      affectedStrategies,

      meanTetDelta:
        roundNullable(
          meanTetDelta,
        ),

      maximumTetDelta:
        roundNullable(
          maximumTetDelta,
        ),

      minimumCompletion:
        Math.min(
          ...matching.map(
            (
              row,
            ) =>
              row.completion,
          ),
        ),

      totalUnreachable:
        matching.reduce(
          (
            sum,
            row,
          ) =>
            sum +
            row.unreachable,
          0,
        ),

      totalTimeout:
        matching.reduce(
          (
            sum,
            row,
          ) =>
            sum +
            row.timeout,
          0,
        ),

      totalReroutes:
        matching.reduce(
          (
            sum,
            row,
          ) =>
            sum +
            row.reroutes,
          0,
        ),
    });
  }
}

console.log(
  "\n1. Candidate summary\n",
);

console.table(
  summaryRows,
);

console.log(
  "\n2. Detailed cases with measurable effects\n",
);

console.table(
  detailRows.filter(
    (
      row,
    ) =>
      row.changed ||
      row.unreachable >
        0 ||
      row.timeout >
        0,
  ),
);