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
  HeadlessSimulationResult,
} from "../src/types/headlessSimulation";

import type {
  NavigationGraph,
} from "../src/types/navigation";

import type {
  ScenarioInstance,
} from "../src/types/scenario";

import type {
  SimulationReplayFrame,
} from "../src/types/simulationReplay";

const PARAMETER_SET_VERSION =
  "architecture-v2-hazard-timing-calibration-v1";

const HAZARD_TARGET_ZONE_ID =
  "corridor-main-spine";

const CANDIDATE_ACTIVATION_TIMES =
  [
    4,
    6,
    8,
    10,
    12,
    14,
    16,
    18,
  ] as const;

const EPSILON =
  1e-9;

interface HazardTimingRun {
  readonly activationTimeSeconds:
    number;

  readonly result:
    HeadlessSimulationResult;

  /**
   * Last replay state before the disruption has been applied.
   *
   * When a regular frame already exists at exactly the
   * activation timestamp, that frame is intentionally the
   * pre-event state.
   */
  readonly preActivationFrame:
    SimulationReplayFrame;

  /**
   * First replay state that confirms the disruption is active.
   *
   * Because the engine suppresses duplicate replay timestamps,
   * this can occur one timestep after the nominal event time.
   */
  readonly firstAppliedFrame:
    SimulationReplayFrame;

  readonly graph:
    NavigationGraph;
}

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

  return runHeadlessSimulation({
    scenario,

    environment:
      layoutAArchitectureV2Environment,

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
     * Capture every numerical timestep.
     *
     * This makes the pre/post disruption state as precise
     * as the authoritative 0.05-second simulation timestep.
     */
    replayIntervalSeconds:
      RESEARCH_TIMESTEP_SECONDS,

    replayObserver,
  });
}

function runBaseline():
  HeadlessSimulationResult {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      "layout-a-v2-medium-42-d0-hazard-timing-reference",

    parameterSetVersion:
      PARAMETER_SET_VERSION,

    disruptionSchedule:
      [],
  };

  return runSimulation(
    scenario,
    base.graph,
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

function runHazardTiming(
  activationTimeSeconds:
    number,
): HazardTimingRun {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const eventId =
    `v2-hazard-main-spine-t${activationTimeSeconds}`;

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      `layout-a-v2-medium-42-hazard-t${activationTimeSeconds}`,

    parameterSetVersion:
      PARAMETER_SET_VERSION,

    disruptionSchedule: [
      {
        id:
          eventId,

        type:
          "HAZARD_ACTIVATE",

        activationTimeSeconds,

        targetId:
          HAZARD_TARGET_ZONE_ID,
      },
    ],
  };

  const frames:
    SimulationReplayFrame[] =
  [];

  const result =
    runSimulation(
      scenario,
      base.graph,
      (
        frame,
      ) => {
        frames.push(
          frame,
        );
      },
    );

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
      `Hazard ${eventId} was never applied.`,
    );
  }

  /**
   * The first frame carrying the disruption may be one timestep
   * later than the nominal activation time.
   *
   * Example:
   *
   * regular pre-event frame = 4.00 s
   * hazard applied internally = 4.00 s
   * first frame carrying event = 4.05 s
   *
   * This occurs because runHeadlessSimulation deliberately avoids
   * emitting two replay frames with identical timestamps.
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
      `No replay frame recorded the applied hazard for t=${activationTimeSeconds}.`,
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
   * Prefer the immediately preceding replay frame.
   *
   * It is guaranteed not to contain this event because
   * firstAppliedIndex is the first frame where the event appears.
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
   * Defensive fallback:
   * find the latest frame at or before the nominal activation
   * time that still does not contain the event.
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
      `No pre-activation replay frame captured for t=${activationTimeSeconds}.`,
    );
  }

  if (
    frameHasAppliedEvent(
      preActivationFrame,
      eventId,
    )
  ) {
    throw new Error(
      `Selected pre-activation frame already contains ${eventId}.`,
    );
  }

  if (
    !frameHasAppliedEvent(
      firstAppliedFrame,
      eventId,
    )
  ) {
    throw new Error(
      `Selected post-activation frame does not contain ${eventId}.`,
    );
  }

  return {
    activationTimeSeconds,

    result,

    preActivationFrame,

    firstAppliedFrame,

    graph:
      base.graph,
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

function countAgentsOnTargetEdge(
  run:
    HazardTimingRun,
): number {
  const edgeZoneById =
    new Map(
      run.graph
        .edges
        .map(
          (
            edge,
          ) =>
            [
              edge.id,
              edge.zoneId,
            ] as const,
        ),
    );

  return run
    .preActivationFrame
    .snapshot
    .agents
    .filter(
      (
        agent,
      ) => {
        if (
          agent.status !==
          "ACTIVE"
        ) {
          return false;
        }

        if (
          agent.currentEdgeId ===
          null
        ) {
          return false;
        }

        return (
          edgeZoneById.get(
            agent.currentEdgeId,
          ) ===
          HAZARD_TARGET_ZONE_ID
        );
      },
    )
    .length;
}

function countActiveRoutesThroughTarget(
  run:
    HazardTimingRun,
): number {
  const targetEdgeIds =
    new Set(
      run.graph
        .edges
        .filter(
          (
            edge,
          ) =>
            edge.zoneId ===
            HAZARD_TARGET_ZONE_ID,
        )
        .map(
          (
            edge,
          ) =>
            edge.id,
        ),
    );

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

        return remainingEdges.some(
          (
            edgeId,
          ) =>
            targetEdgeIds.has(
              edgeId,
            ),
        );
      },
    )
    .length;
}

function countPostHazardReviews(
  run:
    HazardTimingRun,
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

function countHazardAvoidanceReviews(
  run:
    HazardTimingRun,
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
          "HAZARD_AVOIDANCE",
        ),
    )
    .length;
}

function countChangedRoutesAfterHazard(
  run:
    HazardTimingRun,
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
        runHazardTiming(
          time,
        ),
    );

console.log(
  "\n=== ARCHITECTURE V2 D1 HAZARD TIMING CALIBRATION ===\n",
);

console.log(
  `Target zone: ${HAZARD_TARGET_ZONE_ID}`,
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

    hazardExposurePersonSeconds:
      Number(
        baseline
          .metrics
          .populationHazardExposurePersonSeconds
          .toFixed(
            2,
          ),
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
  "\n=== HAZARD TIMING SWEEP ===\n",
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

        onTargetEdgeBefore:
          countAgentsOnTargetEdge(
            run,
          ),

        activeRoutesThroughTargetBefore:
          countActiveRoutesThroughTarget(
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

        hazardExposurePersonSeconds:
          Number(
            metrics
              .populationHazardExposurePersonSeconds
              .toFixed(
                2,
              ),
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

        rerouteReviewsAfterHazard:
          countPostHazardReviews(
            run,
          ),

        hazardAvoidanceReviews:
          countHazardAvoidanceReviews(
            run,
          ),

        changedRoutesAfterHazard:
          countChangedRoutesAfterHazard(
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
  "\n=== EXIT UTILIZATION BY HAZARD TIMING ===\n",
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
  "\n=== END D1 HAZARD TIMING CALIBRATION ===\n",
);