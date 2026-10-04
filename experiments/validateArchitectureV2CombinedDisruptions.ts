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
  DecisionTraceReasonCode,
} from "../src/types/decisionTrace";

import type {
  HeadlessSimulationResult,
} from "../src/types/headlessSimulation";

import type {
  DisruptionEvent,
  ScenarioInstance,
} from "../src/types/scenario";

import type {
  SimulationReplayFrame,
} from "../src/types/simulationReplay";

const PARAMETER_SET_VERSION =
  "architecture-v2-d4-combined-validation-v1";

const HAZARD_ZONE_ID =
  "corridor-main-spine";

const HAZARD_ACTIVATION_TIME_SECONDS =
  12;

const EXIT_ID =
  "exit-south-central";

const EXIT_BLOCK_TIME_SECONDS =
  18;

const EPSILON =
  1e-9;

type ConditionId =
  | "D0"
  | "D1"
  | "D2"
  | "D4";

interface ConditionDefinition {
  readonly id:
    ConditionId;

  readonly label:
    string;

  readonly disruptions:
    readonly DisruptionEvent[];
}

interface ConditionRun {
  readonly definition:
    ConditionDefinition;

  readonly result:
    HeadlessSimulationResult;

  readonly frames:
    readonly SimulationReplayFrame[];
}

const HAZARD_EVENT:
  DisruptionEvent = {
  id:
    "v2-d1-main-spine-hazard",

  type:
    "HAZARD_ACTIVATE",

  activationTimeSeconds:
    HAZARD_ACTIVATION_TIME_SECONDS,

  targetId:
    HAZARD_ZONE_ID,
};

const EXIT_BLOCK_EVENT:
  DisruptionEvent = {
  id:
    "v2-d2-south-central-exit-block",

  type:
    "EXIT_BLOCK",

  activationTimeSeconds:
    EXIT_BLOCK_TIME_SECONDS,

  targetId:
    EXIT_ID,
};

const CONDITIONS:
  readonly ConditionDefinition[] =
[
  {
    id:
      "D0",

    label:
      "Baseline",

    disruptions:
      [],
  },

  {
    id:
      "D1",

    label:
      "Main-spine hazard at 12 s",

    disruptions: [
      HAZARD_EVENT,
    ],
  },

  {
    id:
      "D2",

    label:
      "South-central exit block at 18 s",

    disruptions: [
      EXIT_BLOCK_EVENT,
    ],
  },

  {
    id:
      "D4",

    label:
      "Combined hazard + exit block",

    disruptions: [
      HAZARD_EVENT,
      EXIT_BLOCK_EVENT,
    ],
  },
];

function runCondition(
  definition:
    ConditionDefinition,
): ConditionRun {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      `layout-a-v2-medium-42-${definition.id.toLowerCase()}-combined-validation`,

    parameterSetVersion:
      PARAMETER_SET_VERSION,

    disruptionSchedule:
      definition.disruptions,
  };

  const frames:
    SimulationReplayFrame[] =
  [];

  const result =
    runHeadlessSimulation({
      scenario,

      environment:
        layoutAArchitectureV2Environment,

      graph:
        base.graph,

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

      replayObserver:
        (
          frame,
        ) => {
          frames.push(
            frame,
          );
        },
    });

  return {
    definition,
    result,
    frames,
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

function frameHasEvent(
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
 * Finds the last replay state at or before the
 * scheduled event time before that particular event
 * appears in appliedDisruptions.
 *
 * For the 18 s exit-block event in D4, the earlier
 * 12 s hazard is allowed to already be active.
 */
function findPreEventFrame(
  run:
    ConditionRun,
  event:
    DisruptionEvent,
): SimulationReplayFrame {
  const candidates =
    run.frames
      .filter(
        (
          frame,
        ) =>
          frame
            .snapshot
            .simulationTimeSeconds <=
            event
              .activationTimeSeconds +
              EPSILON &&
          !frameHasEvent(
            frame,
            event.id,
          ),
      );

  const frame =
    candidates[
      candidates.length -
        1
    ];

  if (!frame) {
    throw new Error(
      `No pre-event frame found for ${event.id} in ${run.definition.id}.`,
    );
  }

  return frame;
}

function findFirstAppliedFrame(
  run:
    ConditionRun,
  event:
    DisruptionEvent,
): SimulationReplayFrame {
  const frame =
    run.frames
      .find(
        (
          candidate,
        ) =>
          frameHasEvent(
            candidate,
            event.id,
          ),
      );

  if (!frame) {
    throw new Error(
      `No applied frame found for ${event.id} in ${run.definition.id}.`,
    );
  }

  return frame;
}

function countReasonCode(
  run:
    ConditionRun,
  reason:
    DecisionTraceReasonCode,
  minimumTimeSeconds:
    number,
): number {
  return run
    .result
    .decisionTrace
    .filter(
      (
        entry,
      ) =>
        entry
          .simulationTimeSeconds +
          EPSILON >=
          minimumTimeSeconds &&
        entry
          .reasonCodes
          .includes(
            reason,
          ),
    )
    .length;
}

function countChangedRoutesAfter(
  run:
    ConditionRun,
  minimumTimeSeconds:
    number,
): number {
  return run
    .result
    .decisionTrace
    .filter(
      (
        entry,
      ) =>
        entry
          .simulationTimeSeconds +
          EPSILON >=
          minimumTimeSeconds &&
        entry.routeChanged,
    )
    .length;
}

function countAgentsOnZone(
  frame:
    SimulationReplayFrame,
  zoneId:
    string,
): number {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const zoneByEdge =
    new Map(
      base.graph
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

  return frame
    .snapshot
    .agents
    .filter(
      (
        agent,
      ) => {
        if (
          agent.status !==
            "ACTIVE" ||
          agent.currentEdgeId ===
            null
        ) {
          return false;
        }

        return (
          zoneByEdge.get(
            agent.currentEdgeId,
          ) ===
          zoneId
        );
      },
    )
    .length;
}

function countRemainingRoutesThroughZone(
  frame:
    SimulationReplayFrame,
  zoneId:
    string,
): number {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const zoneByEdge =
    new Map(
      base.graph
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

  const activeAgentIds =
    new Set(
      frame
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

  return frame
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

        const remainingEdgeIds =
          route
            .edgeIds
            .slice(
              route
                .routeCursorIndex,
            );

        return remainingEdgeIds
          .some(
            (
              edgeId,
            ) =>
              zoneByEdge.get(
                edgeId,
              ) ===
              zoneId,
          );
      },
    )
    .length;
}

function countActiveTargetingExit(
  frame:
    SimulationReplayFrame,
  exitId:
    string,
): number {
  return frame
    .snapshot
    .agents
    .filter(
      (
        agent,
      ) =>
        agent.status ===
          "ACTIVE" &&
        agent.targetExitId ===
          exitId,
    )
    .length;
}

function countAlreadyEvacuatedThroughExit(
  frame:
    SimulationReplayFrame,
  exitId:
    string,
): number {
  return frame
    .snapshot
    .agents
    .filter(
      (
        agent,
      ) =>
        agent.status ===
          "EVACUATED" &&
        agent.targetExitId ===
          exitId,
    )
    .length;
}

function requireRun(
  runs:
    readonly ConditionRun[],
  id:
    ConditionId,
): ConditionRun {
  const run =
    runs.find(
      (
        candidate,
      ) =>
        candidate
          .definition
          .id ===
        id,
    );

  if (!run) {
    throw new Error(
      `Missing condition run ${id}.`,
    );
  }

  return run;
}

const runs =
  CONDITIONS.map(
    runCondition,
  );

const d0 =
  requireRun(
    runs,
    "D0",
  );

const d1 =
  requireRun(
    runs,
    "D1",
  );

const d2 =
  requireRun(
    runs,
    "D2",
  );

const d4 =
  requireRun(
    runs,
    "D4",
  );

/**
 * Verify that D4 contains both independently
 * calibrated disruption events.
 */
if (
  d4.result
    .appliedDisruptions
    .length !==
    2
) {
  throw new Error(
    `D4 expected exactly 2 applied disruptions, found ${d4.result.appliedDisruptions.length}.`,
  );
}

const d4HazardPre =
  findPreEventFrame(
    d4,
    HAZARD_EVENT,
  );

const d4HazardApplied =
  findFirstAppliedFrame(
    d4,
    HAZARD_EVENT,
  );

const d4ExitPre =
  findPreEventFrame(
    d4,
    EXIT_BLOCK_EVENT,
  );

const d4ExitApplied =
  findFirstAppliedFrame(
    d4,
    EXIT_BLOCK_EVENT,
  );

console.log(
  "\n=== ARCHITECTURE V2 D4 COMBINED-DISRUPTION VALIDATION ===\n",
);

console.log(
  `Occupancy: ${d0.result.metrics.totalAgents}`,
);

console.log(
  "Strategy: ADAPTIVE_HYBRID",
);

console.log(
  `Hazard: ${HAZARD_ZONE_ID} at ${HAZARD_ACTIVATION_TIME_SECONDS.toFixed(2)} s`,
);

console.log(
  `Exit block: ${EXIT_ID} at ${EXIT_BLOCK_TIME_SECONDS.toFixed(2)} s`,
);

console.log(
  `Numerical timestep: ${RESEARCH_TIMESTEP_SECONDS.toFixed(2)} s`,
);

console.log(
  "\n=== CONDITION COMPARISON ===\n",
);

console.table(
  runs.map(
    (
      run,
    ) => {
      const metrics =
        run.result
          .metrics;

      return {
        condition:
          run
            .definition
            .id,

        description:
          run
            .definition
            .label,

        appliedEvents:
          run
            .result
            .appliedDisruptions
            .length,

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

        tetChangeVsD0Percent:
          percentChange(
            metrics
              .totalEvacuationTimeSeconds,

            d0
              .result
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

        hazardAvoidanceReviews:
          countReasonCode(
            run,
            "HAZARD_AVOIDANCE",
            HAZARD_ACTIVATION_TIME_SECONDS,
          ),

        exitUnavailableReviews:
          countReasonCode(
            run,
            "EXIT_UNAVAILABLE",
            EXIT_BLOCK_TIME_SECONDS,
          ),

        changedRoutesAfter12:
          countChangedRoutesAfter(
            run,
            HAZARD_ACTIVATION_TIME_SECONDS,
          ),

        changedRoutesAfter18:
          countChangedRoutesAfter(
            run,
            EXIT_BLOCK_TIME_SECONDS,
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
  "\n=== D4 EVENT-STATE DIAGNOSTICS ===\n",
);

console.table([
  {
    event:
      "Hazard activation",

    scheduledTime:
      HAZARD_ACTIVATION_TIME_SECONDS,

    preEventFrameTime:
      Number(
        d4HazardPre
          .snapshot
          .simulationTimeSeconds
          .toFixed(
            2,
          ),
      ),

    firstAppliedFrameTime:
      Number(
        d4HazardApplied
          .snapshot
          .simulationTimeSeconds
          .toFixed(
            2,
          ),
      ),

    evacuatedBeforeEvent:
      d4HazardPre
        .metrics
        .evacuatedAgents,

    activeBeforeEvent:
      d4HazardPre
        .metrics
        .activeAgents,

    agentsPhysicallyInTarget:
      countAgentsOnZone(
        d4HazardPre,
        HAZARD_ZONE_ID,
      ),

    activeRoutesThroughTarget:
      countRemainingRoutesThroughZone(
        d4HazardPre,
        HAZARD_ZONE_ID,
      ),

    activeTargetingBlockedExit:
      "—",

    alreadyUsedBlockedExit:
      "—",
  },

  {
    event:
      "South-central exit block",

    scheduledTime:
      EXIT_BLOCK_TIME_SECONDS,

    preEventFrameTime:
      Number(
        d4ExitPre
          .snapshot
          .simulationTimeSeconds
          .toFixed(
            2,
          ),
      ),

    firstAppliedFrameTime:
      Number(
        d4ExitApplied
          .snapshot
          .simulationTimeSeconds
          .toFixed(
            2,
          ),
      ),

    evacuatedBeforeEvent:
      d4ExitPre
        .metrics
        .evacuatedAgents,

    activeBeforeEvent:
      d4ExitPre
        .metrics
        .activeAgents,

    agentsPhysicallyInTarget:
      "—",

    activeRoutesThroughTarget:
      "—",

    activeTargetingBlockedExit:
      countActiveTargetingExit(
        d4ExitPre,
        EXIT_ID,
      ),

    alreadyUsedBlockedExit:
      countAlreadyEvacuatedThroughExit(
        d4ExitPre,
        EXIT_ID,
      ),
  },
]);

console.log(
  "\n=== APPLIED DISRUPTIONS ===\n",
);

console.table(
  runs.flatMap(
    (
      run,
    ) =>
      run
        .result
        .appliedDisruptions
        .map(
          (
            disruption,
          ) => ({
            condition:
              run
                .definition
                .id,

            eventId:
              disruption.id,

            type:
              disruption.type,

            scheduledActivationSeconds:
              disruption
                .activationTimeSeconds,

            targetId:
              disruption.targetId,
          }),
        ),
  ),
);

console.log(
  "\n=== EXIT UTILIZATION ===\n",
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
            condition:
              run
                .definition
                .id,

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
  "\n=== D4 VALIDATION CHECKS ===\n",
);

console.table([
  {
    check:
      "D0 baseline preserved",

    passed:
      d0
        .result
        .metrics
        .evacuatedAgents ===
        42 &&
      Math.abs(
        (
          d0
            .result
            .metrics
            .totalEvacuationTimeSeconds ??
          0
        ) -
        39.9,
      ) <
        0.01,
  },

  {
    check:
      "D1 hazard applied",

    passed:
      d1
        .result
        .appliedDisruptions
        .some(
          (
            event,
          ) =>
            event.id ===
            HAZARD_EVENT.id,
        ),
  },

  {
    check:
      "D2 exit block applied",

    passed:
      d2
        .result
        .appliedDisruptions
        .some(
          (
            event,
          ) =>
            event.id ===
            EXIT_BLOCK_EVENT.id,
        ),
  },

  {
    check:
      "D4 contains both events",

    passed:
      d4
        .result
        .appliedDisruptions
        .some(
          (
            event,
          ) =>
            event.id ===
            HAZARD_EVENT.id,
        ) &&
      d4
        .result
        .appliedDisruptions
        .some(
          (
            event,
          ) =>
            event.id ===
            EXIT_BLOCK_EVENT.id,
        ),
  },

  {
    check:
      "D4 completes evacuation",

    passed:
      d4
        .result
        .metrics
        .evacuatedAgents ===
        42 &&
      d4
        .result
        .metrics
        .unreachableAgents ===
        0 &&
      d4
        .result
        .metrics
        .timeoutAgents ===
        0,
  },

  {
    check:
      "Exit block still affects active occupants in D4",

    passed:
      countActiveTargetingExit(
        d4ExitPre,
        EXIT_ID,
      ) >
      0,
  },
]);

console.log(
  "\n=== END D4 COMBINED-DISRUPTION VALIDATION ===\n",
);