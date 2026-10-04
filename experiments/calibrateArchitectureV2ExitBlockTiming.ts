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
  "architecture-v2-exit-block-timing-calibration-v1";

const TARGET_EXIT_ID =
  "exit-south-central";

const CANDIDATE_ACTIVATION_TIMES =
  [
    8,
    10,
    12,
    14,
    16,
    18,
    20,
    22,
  ] as const;

const EPSILON =
  1e-9;

interface ExitBlockTimingRun {
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
      "layout-a-v2-medium-42-d0-exit-block-reference",

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

function runExitBlockTiming(
  activationTimeSeconds:
    number,
): ExitBlockTimingRun {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const eventId =
    `v2-exit-south-central-block-t${activationTimeSeconds}`;

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      `layout-a-v2-medium-42-exit-block-t${activationTimeSeconds}`,

    parameterSetVersion:
      PARAMETER_SET_VERSION,

    disruptionSchedule: [
      {
        id:
          eventId,

        type:
          "EXIT_BLOCK",

        activationTimeSeconds,

        targetId:
          TARGET_EXIT_ID,
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
      `Exit block ${eventId} was never applied.`,
    );
  }

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
      `No replay frame recorded the exit block at t=${activationTimeSeconds}.`,
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

  const precedingFrame =
    firstAppliedIndex >
      0
      ? frames[
          firstAppliedIndex -
            1
        ]
      : undefined;

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
      `Selected post-block frame does not contain ${eventId}.`,
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

function countActiveTargetingExit(
  run:
    ExitBlockTimingRun,
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
        agent.targetExitId ===
          TARGET_EXIT_ID,
    )
    .length;
}

function countEvacuatedThroughTargetBeforeBlock(
  run:
    ExitBlockTimingRun,
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
          "EVACUATED" &&
        agent.targetExitId ===
          TARGET_EXIT_ID,
    )
    .length;
}

function countActiveRoutesEndingAtTarget(
  run:
    ExitBlockTimingRun,
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
      ) =>
        activeAgentIds.has(
          route.agentId,
        ) &&
        route.targetExitId ===
          TARGET_EXIT_ID,
    )
    .length;
}

function countPostBlockReviews(
  run:
    ExitBlockTimingRun,
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

function countExitUnavailableReviews(
  run:
    ExitBlockTimingRun,
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
          "EXIT_UNAVAILABLE",
        ),
    )
    .length;
}

function countChangedRoutesAfterBlock(
  run:
    ExitBlockTimingRun,
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
        runExitBlockTiming(
          time,
        ),
    );

const baselineTargetExit =
  baseline
    .metrics
    .exitUtilization
    .find(
      (
        exit,
      ) =>
        exit.exitId ===
        TARGET_EXIT_ID,
    );

if (!baselineTargetExit) {
  throw new Error(
    `Baseline exit utilization missing ${TARGET_EXIT_ID}.`,
  );
}

console.log(
  "\n=== ARCHITECTURE V2 D2 EXIT-BLOCK TIMING CALIBRATION ===\n",
);

console.log(
  `Target exit: ${TARGET_EXIT_ID}`,
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

    targetExitFinalUsers:
      baselineTargetExit
        .evacuatedAgents,

    targetExitFinalFraction:
      Number(
        baselineTargetExit
          .fractionOfEvacuatedAgents
          .toFixed(
            4,
          ),
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
  "\n=== EXIT-BLOCK TIMING SWEEP ===\n",
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

        evacuatedThroughTargetBefore:
          countEvacuatedThroughTargetBeforeBlock(
            run,
          ),

        activeTargetingBlockedExitBefore:
          countActiveTargetingExit(
            run,
          ),

        activeRoutesEndingAtBlockedExitBefore:
          countActiveRoutesEndingAtTarget(
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

        exitUnavailableReviews:
          countExitUnavailableReviews(
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
  "\n=== EXIT UTILIZATION BY BLOCK TIMING ===\n",
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
  "\n=== END D2 EXIT-BLOCK TIMING CALIBRATION ===\n",
);