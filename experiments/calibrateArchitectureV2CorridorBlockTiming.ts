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
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
} from "../src/scenario/researchParameterSet";

import type {
  BuildingEnvironment,
  BuildingZone,
} from "../src/types/environment";

import type {
  HeadlessSimulationResult,
} from "../src/types/headlessSimulation";

import type {
  NavigationEdge,
  NavigationGraph,
} from "../src/types/navigation";

import type {
  ScenarioInstance,
} from "../src/types/scenario";

import type {
  SimulationReplayFrame,
} from "../src/types/simulationReplay";

/**
 * Architecture V2 D3 calibration.
 *
 * The D3 target was selected from:
 *
 * 1. baseline edge-usage profiling;
 * 2. comparison of three candidate corridor segments;
 * 3. verification that an alternate path remains available.
 *
 * Selected target:
 *
 * main-central
 *     ->
 * central-01-access
 *
 * Navigation edge:
 *
 * edge-main-central-central-01
 */
const PARAMETER_SET_VERSION =
  "architecture-v2-corridor-block-timing-calibration-v2";

/**
 * Temporary research-calibration zone.
 *
 * This zone is NOT yet part of the production
 * Architecture V2 environment.
 *
 * It is introduced only for this timing experiment.
 */
const BLOCKABLE_ZONE_ID =
  "corridor-main-central-east-blockable";

/**
 * Selected D3 navigation segment.
 */
const TARGET_EDGE_ID =
  "edge-main-central-central-01";

/**
 * Timing candidates.
 *
 * We deliberately test a range rather than assuming
 * that the 12-second candidate-comparison time is
 * automatically the best formal D3 timing.
 */
const CANDIDATE_ACTIVATION_TIMES =
  [
    8,
    10,
    12,
    14,
    16,
    18,
  ] as const;

const EPSILON =
  1e-9;

/**
 * Selected D3 physical corridor segment.
 *
 * main-central:
 *   x = 36.0
 *   y = 20.0
 *
 * central-01-access:
 *   x = 40.5
 *   y = 20.0
 *
 * Segment length:
 *   4.5 m
 *
 * Main corridor width:
 *   4.0 m
 *
 * Therefore the temporary block zone spans:
 *
 * x = 36.0 .. 40.5
 * y = 18.0 .. 22.0
 */
const BLOCKABLE_ZONE:
  BuildingZone = {
  id:
    BLOCKABLE_ZONE_ID,

  type:
    "CORRIDOR",

  polygon: {
    vertices: [
      {
        x:
          36,

        y:
          18,
      },

      {
        x:
          40.5,

        y:
          18,
      },

      {
        x:
          40.5,

        y:
          22,
      },

      {
        x:
          36,

        y:
          22,
      },
    ],
  },
};

interface CorridorBlockTimingRun {
  readonly activationTimeSeconds:
    number;

  readonly result:
    HeadlessSimulationResult;

  readonly preActivationFrame:
    SimulationReplayFrame;

  readonly firstAppliedFrame:
    SimulationReplayFrame;

  readonly graph:
    NavigationGraph;
}

/**
 * Adds the temporary D3 blockable zone to a copy
 * of the authoritative Architecture V2 environment.
 *
 * Production environment data are not mutated.
 */
function createCalibrationEnvironment():
  BuildingEnvironment {
  const duplicate =
    layoutAArchitectureV2Environment
      .zones
      .some(
        (
          zone,
        ) =>
          zone.id ===
          BLOCKABLE_ZONE_ID,
      );

  if (
    duplicate
  ) {
    throw new Error(
      `Calibration zone ${BLOCKABLE_ZONE_ID} already exists in the production environment.`,
    );
  }

  return {
    ...layoutAArchitectureV2Environment,

    zones: [
      ...layoutAArchitectureV2Environment
        .zones,

      BLOCKABLE_ZONE,
    ],
  };
}

/**
 * Creates a calibration graph in which ONLY the
 * selected D3 edge is assigned to the temporary
 * blockable zone.
 *
 * All other navigation edges remain unchanged.
 */
function createCalibrationGraph(
  baseGraph:
    NavigationGraph,
): NavigationGraph {
  const targetEdges =
    baseGraph
      .edges
      .filter(
        (
          edge,
        ) =>
          edge.id ===
          TARGET_EDGE_ID,
      );

  if (
    targetEdges.length !==
    1
  ) {
    throw new Error(
      `Expected exactly one target edge ${TARGET_EDGE_ID}, found ${targetEdges.length}.`,
    );
  }

  const edges:
    readonly NavigationEdge[] =
    baseGraph
      .edges
      .map(
        (
          edge,
        ) => {
          if (
            edge.id !==
            TARGET_EDGE_ID
          ) {
            return edge;
          }

          return {
            ...edge,

            zoneId:
              BLOCKABLE_ZONE_ID,
          };
        },
      );

  return {
    ...baseGraph,

    edges,
  };
}

function requireTargetEdge(
  graph:
    NavigationGraph,
): NavigationEdge {
  const edge =
    graph
      .edges
      .find(
        (
          candidate,
        ) =>
          candidate.id ===
          TARGET_EDGE_ID,
      );

  if (!edge) {
    throw new Error(
      `Target edge not found: ${TARGET_EDGE_ID}`,
    );
  }

  if (
    edge.zoneId !==
    BLOCKABLE_ZONE_ID
  ) {
    throw new Error(
      `Target edge ${TARGET_EDGE_ID} is not assigned to ${BLOCKABLE_ZONE_ID}.`,
    );
  }

  return edge;
}

/**
 * Runs one Architecture V2 simulation using:
 *
 * - Medium occupancy = 42
 * - Adaptive Hybrid
 * - 0.05 s timestep
 * - current calibrated research parameters
 *
 * The only temporary change is the D3 blockable zone.
 */
function runSimulation(
  scenario:
    ScenarioInstance,
  graph:
    NavigationGraph,
  replayObserver?:
    (
      frame:
        SimulationReplayFrame,
    ) => void,
): HeadlessSimulationResult {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const environment =
    createCalibrationEnvironment();

  return runHeadlessSimulation({
    scenario,

    environment,

    graph,

    exits:
      layoutAArchitectureV2Exits,

    spawnZones:
      base.spawnZones,

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

    /**
     * Record every numerical timestep so the state
     * immediately before and immediately after the
     * disruption can be reconstructed precisely.
     */
    replayIntervalSeconds:
      RESEARCH_TIMESTEP_SECONDS,

    replayObserver,
  });
}

/**
 * D0 reference using the SAME temporary graph structure,
 * but with no disruption.
 *
 * This verifies that merely assigning the edge to its own
 * temporary zone does not alter baseline behavior.
 */
function runBaseline():
  HeadlessSimulationResult {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const graph =
    createCalibrationGraph(
      base.graph,
    );

  requireTargetEdge(
    graph,
  );

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      "layout-a-v2-medium-42-d0-d3-reference",

    parameterSetVersion:
      PARAMETER_SET_VERSION,

    disruptionSchedule:
      [],
  };

  return runSimulation(
    scenario,
    graph,
  );
}

function frameHasAppliedEvent(
  frame:
    SimulationReplayFrame,
  eventId:
    string,
): boolean {
  return frame
    .appliedDisruptions
    .some(
      (
        disruption,
      ) =>
        disruption.id ===
        eventId,
    );
}

/**
 * Runs one D3 timing candidate.
 */
function runCorridorBlockTiming(
  activationTimeSeconds:
    number,
): CorridorBlockTimingRun {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const graph =
    createCalibrationGraph(
      base.graph,
    );

  requireTargetEdge(
    graph,
  );

  const eventId =
    `v2-d3-main-central-block-t${activationTimeSeconds}`;

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      `layout-a-v2-medium-42-d3-t${activationTimeSeconds}`,

    parameterSetVersion:
      PARAMETER_SET_VERSION,

    disruptionSchedule: [
      {
        id:
          eventId,

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds,

        targetId:
          BLOCKABLE_ZONE_ID,
      },
    ],
  };

  const frames:
    SimulationReplayFrame[] =
  [];

  const result =
    runSimulation(
      scenario,
      graph,
      (
        frame,
      ) => {
        frames.push(
          frame,
        );
      },
    );

  /**
   * Confirm that the authoritative disruption controller
   * actually applied the event.
   */
  const appliedRecord =
    result
      .appliedDisruptions
      .find(
        (
          disruption,
        ) =>
          disruption.id ===
          eventId,
      );

  if (!appliedRecord) {
    throw new Error(
      `Corridor block ${eventId} was never applied.`,
    );
  }

  /**
   * Find the first replay frame that contains the
   * already-applied disruption.
   *
   * Because duplicate replay timestamps are suppressed,
   * an event scheduled at 12.00 s will normally first
   * appear in a replay frame at 12.05 s.
   */
  const firstAppliedIndex =
    frames.findIndex(
      (
        frame,
      ) =>
        frameHasAppliedEvent(
          frame,
          eventId,
        ),
    );

  if (
    firstAppliedIndex <
    0
  ) {
    throw new Error(
      `No replay frame recorded the corridor block at t=${activationTimeSeconds}.`,
    );
  }

  const firstAppliedFrame =
    frames[
      firstAppliedIndex
    ];

  if (!firstAppliedFrame) {
    throw new Error(
      `Missing first applied frame for t=${activationTimeSeconds}.`,
    );
  }

  /**
   * Normally the immediately preceding replay frame is
   * the exact pre-event state.
   */
  const precedingFrame =
    firstAppliedIndex >
      0
      ? frames[
          firstAppliedIndex -
            1
        ]
      : undefined;

  /**
   * Defensive fallback in case replay sequencing changes.
   */
  const fallbackPreFrame =
    [
      ...frames,
    ]
      .reverse()
      .find(
        (
          frame,
        ) =>
          frame
            .snapshot
            .simulationTimeSeconds <=
            activationTimeSeconds +
              EPSILON &&
          !frameHasAppliedEvent(
            frame,
            eventId,
          ),
      );

  const preActivationFrame =
    precedingFrame ??
    fallbackPreFrame;

  if (!preActivationFrame) {
    throw new Error(
      `No pre-block replay frame captured for t=${activationTimeSeconds}.`,
    );
  }

  if (
    frameHasAppliedEvent(
      preActivationFrame,
      eventId,
    )
  ) {
    throw new Error(
      `Selected pre-block frame already contains ${eventId}.`,
    );
  }

  if (
    !frameHasAppliedEvent(
      firstAppliedFrame,
      eventId,
    )
  ) {
    throw new Error(
      `Selected first-applied frame does not contain ${eventId}.`,
    );
  }

  return {
    activationTimeSeconds,

    result,

    preActivationFrame,

    firstAppliedFrame,

    graph,
  };
}

function formatNullable(
  value:
    number |
    null,
): number |
  string {
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
    number |
    null,
  baseline:
    number |
    null,
): number |
  string {
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

/**
 * Counts occupants physically traversing the selected
 * corridor segment immediately before the block.
 */
function countAgentsOnBlockedEdge(
  run:
    CorridorBlockTimingRun,
): number {
  return run
    .preActivationFrame
    .snapshot
    .agents
    .filter(
      (
        agent,
      ) =>
        agent.status ===
          "ACTIVE" &&
        agent.currentEdgeId ===
          TARGET_EDGE_ID,
    )
    .length;
}

/**
 * Counts active occupants whose remaining planned path
 * still depends on the selected corridor segment.
 */
function countActiveRoutesThroughBlockedEdge(
  run:
    CorridorBlockTimingRun,
): number {
  const activeAgentIds =
    new Set(
      run
        .preActivationFrame
        .snapshot
        .agents
        .filter(
          (
            agent,
          ) =>
            agent.status ===
            "ACTIVE",
        )
        .map(
          (
            agent,
          ) =>
            agent.id,
        ),
    );

  return run
    .preActivationFrame
    .routes
    .filter(
      (
        route,
      ) => {
        if (
          !activeAgentIds.has(
            route.agentId,
          )
        ) {
          return false;
        }

        const remainingEdges =
          route.edgeIds.slice(
            route.routeCursorIndex,
          );

        return remainingEdges.includes(
          TARGET_EDGE_ID,
        );
      },
    )
    .length;
}

/**
 * All Adaptive Hybrid route reviews after activation.
 */
function countPostBlockReviews(
  run:
    CorridorBlockTimingRun,
): number {
  return run
    .result
    .decisionTrace
    .filter(
      (
        entry,
      ) =>
        entry.eventType ===
          "REROUTE_REVIEW" &&
        entry.simulationTimeSeconds +
          EPSILON >=
          run.activationTimeSeconds,
    )
    .length;
}

/**
 * Reviews specifically caused by the remaining route
 * becoming unavailable because of the corridor closure.
 */
function countRouteBlockedReviews(
  run:
    CorridorBlockTimingRun,
): number {
  return run
    .result
    .decisionTrace
    .filter(
      (
        entry,
      ) =>
        entry.simulationTimeSeconds +
          EPSILON >=
          run.activationTimeSeconds &&
        entry.reasonCodes.includes(
          "ROUTE_BLOCKED",
        ),
    )
    .length;
}

/**
 * Actual accepted path changes after D3 activates.
 */
function countChangedRoutesAfterBlock(
  run:
    CorridorBlockTimingRun,
): number {
  return run
    .result
    .decisionTrace
    .filter(
      (
        entry,
      ) =>
        entry.simulationTimeSeconds +
          EPSILON >=
          run.activationTimeSeconds &&
        entry.routeChanged,
    )
    .length;
}

const baseline =
  runBaseline();

const runs =
  CANDIDATE_ACTIVATION_TIMES
    .map(
      (
        time,
      ) =>
        runCorridorBlockTiming(
          time,
        ),
    );

console.log(
  "\n=== ARCHITECTURE V2 D3 CORRIDOR-BLOCK TIMING CALIBRATION ===\n",
);

console.log(
  `Selected target edge: ${TARGET_EDGE_ID}`,
);

console.log(
  `Temporary block zone: ${BLOCKABLE_ZONE_ID}`,
);

console.log(
  "Segment: main-central (36,20) -> central-01-access (40.5,20)",
);

console.log(
  `Occupancy: ${baseline.metrics.totalAgents}`,
);

console.log(
  "Strategy: ADAPTIVE_HYBRID",
);

console.log(
  `Numerical timestep: ${RESEARCH_TIMESTEP_SECONDS.toFixed(2)} s`,
);

console.log(
  "\n=== D0 REFERENCE ===\n",
);

console.table([
  {
    occupants:
      baseline
        .metrics
        .totalAgents,

    evacuated:
      baseline
        .metrics
        .evacuatedAgents,

    completionPercent:
      Number(
        (
          baseline
            .metrics
            .completionRate *
          100
        ).toFixed(
          1,
        ),
      ),

    totalEvacuationTimeSeconds:
      formatNullable(
        baseline
          .metrics
          .totalEvacuationTimeSeconds,
      ),

    p95Seconds:
      formatNullable(
        baseline
          .metrics
          .p95EvacuationTimeSeconds,
      ),

    maximumDensity:
      formatNullable(
        baseline
          .metrics
          .maximumLocalDensityPersonsPerSquareMeter,
      ),

    queueExposurePersonSeconds:
      Number(
        baseline
          .queueMetrics
          .populationQueueWaitPersonSeconds
          .toFixed(
            2,
          ),
      ),

    reroutes:
      baseline
        .metrics
        .totalReroutes,
  },
]);

console.log(
  "\n=== D3 TIMING SWEEP ===\n",
);

console.table(
  runs.map(
    (
      run,
    ) => {
      const metrics =
        run.result
          .metrics;

      const before =
        run.preActivationFrame
          .metrics;

      return {
        activationSeconds:
          run.activationTimeSeconds,

        preEventFrameTime:
          Number(
            run
              .preActivationFrame
              .snapshot
              .simulationTimeSeconds
              .toFixed(
                2,
              ),
          ),

        firstAppliedFrameTime:
          Number(
            run
              .firstAppliedFrame
              .snapshot
              .simulationTimeSeconds
              .toFixed(
                2,
              ),
          ),

        evacuatedBeforeEvent:
          before
            .evacuatedAgents,

        activeBeforeEvent:
          before
            .activeAgents,

        onBlockedEdgeBefore:
          countAgentsOnBlockedEdge(
            run,
          ),

        activeRoutesThroughBlockedEdgeBefore:
          countActiveRoutesThroughBlockedEdge(
            run,
          ),

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

        tetChangeVsBaselinePercent:
          percentChange(
            metrics
              .totalEvacuationTimeSeconds,

            baseline
              .metrics
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

        queueExposurePersonSeconds:
          Number(
            run
              .result
              .queueMetrics
              .populationQueueWaitPersonSeconds
              .toFixed(
                2,
              ),
          ),

        reroutes:
          metrics
            .totalReroutes,

        fractionReroutedPercent:
          Number(
            (
              metrics
                .fractionRerouted *
              100
            ).toFixed(
              1,
            ),
          ),

        rerouteReviewsAfterBlock:
          countPostBlockReviews(
            run,
          ),

        routeBlockedReviews:
          countRouteBlockedReviews(
            run,
          ),

        changedRoutesAfterBlock:
          countChangedRoutesAfterBlock(
            run,
          ),

        unreachable:
          metrics
            .unreachableAgents,

        timeouts:
          metrics
            .timeoutAgents,
      };
    },
  ),
);

console.log(
  "\n=== EXIT UTILIZATION BY D3 TIMING ===\n",
);

console.table(
  runs.flatMap(
    (
      run,
    ) =>
      run
        .result
        .metrics
        .exitUtilization
        .map(
          (
            exit,
          ) => ({
            activationSeconds:
              run.activationTimeSeconds,

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
  "\n=== END D3 CORRIDOR-BLOCK TIMING CALIBRATION ===\n",
);