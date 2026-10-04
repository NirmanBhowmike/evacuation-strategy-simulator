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
  NavigationNodeId,
} from "../src/types/navigation";

import type {
  ScenarioInstance,
} from "../src/types/scenario";

import type {
  SimulationReplayFrame,
} from "../src/types/simulationReplay";

const PARAMETER_SET_VERSION =
  "architecture-v2-corridor-target-comparison-v1";

const ACTIVATION_TIME_SECONDS =
  12;

const EPSILON =
  1e-9;

const CANDIDATES =
  [
    {
      id:
        "A",

      label:
        "Main central to Central 01",

      edgeId:
        "edge-main-central-central-01",
    },

    {
      id:
        "B",

      label:
        "East vertical to main spine",

      edgeId:
        "edge-east-vertical-main",
    },

    {
      id:
        "C",

      label:
        "Central 01 to Central 02",

      edgeId:
        "edge-central-01-central-02",
    },
  ] as const;

interface CandidateRun {
  readonly candidateId:
    string;

  readonly candidateLabel:
    string;

  readonly targetEdge:
    NavigationEdge;

  readonly temporaryZoneId:
    string;

  readonly graph:
    NavigationGraph;

  readonly result:
    HeadlessSimulationResult;

  readonly preActivationFrame:
    SimulationReplayFrame;

  readonly firstAppliedFrame:
    SimulationReplayFrame;

  readonly endpointDetourExists:
    boolean;
}

function requireEdge(
  graph:
    NavigationGraph,
  edgeId:
    string,
): NavigationEdge {
  const edge =
    graph
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
      `Navigation edge not found: ${edgeId}`,
    );
  }

  return edge;
}

function createBlockZone(
  edge:
    NavigationEdge,
  graph:
    NavigationGraph,
  zoneId:
    string,
): BuildingZone {
  const from =
    graph
      .nodes
      .find(
        (
          node,
        ) =>
          node.id ===
          edge.from,
      );

  const to =
    graph
      .nodes
      .find(
        (
          node,
        ) =>
          node.id ===
          edge.to,
      );

  if (
    !from ||
    !to
  ) {
    throw new Error(
      `Missing endpoint for ${edge.id}.`,
    );
  }

  const halfWidth =
    Math.max(
      0.5,
      edge.widthMeters /
        2,
    );

  const minX =
    Math.min(
      from.position.x,
      to.position.x,
    );

  const maxX =
    Math.max(
      from.position.x,
      to.position.x,
    );

  const minY =
    Math.min(
      from.position.y,
      to.position.y,
    );

  const maxY =
    Math.max(
      from.position.y,
      to.position.y,
    );

  const mostlyHorizontal =
    Math.abs(
      to.position.x -
        from.position.x,
    ) >=
    Math.abs(
      to.position.y -
        from.position.y,
    );

  if (
    mostlyHorizontal
  ) {
    return {
      id:
        zoneId,

      type:
        "CORRIDOR",

      polygon: {
        vertices: [
          {
            x:
              minX,

            y:
              minY -
              halfWidth,
          },

          {
            x:
              maxX,

            y:
              maxY -
              halfWidth,
          },

          {
            x:
              maxX,

            y:
              maxY +
              halfWidth,
          },

          {
            x:
              minX,

            y:
              minY +
              halfWidth,
          },
        ],
      },
    };
  }

  return {
    id:
      zoneId,

    type:
      "CORRIDOR",

    polygon: {
      vertices: [
        {
          x:
            minX -
            halfWidth,

          y:
            minY,
        },

        {
          x:
            maxX +
            halfWidth,

          y:
            minY,
        },

        {
          x:
            maxX +
            halfWidth,

          y:
            maxY,
        },

        {
          x:
            minX -
            halfWidth,

          y:
            maxY,
        },
      ],
    },
  };
}

function createCalibrationGraph(
  base:
    NavigationGraph,
  edgeId:
    string,
  temporaryZoneId:
    string,
): NavigationGraph {
  const matchCount =
    base
      .edges
      .filter(
        (
          edge,
        ) =>
          edge.id ===
          edgeId,
      )
      .length;

  if (
    matchCount !==
    1
  ) {
    throw new Error(
      `Expected one edge ${edgeId}, found ${matchCount}.`,
    );
  }

  return {
    ...base,

    edges:
      base
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
                    temporaryZoneId,
                }
              : edge,
        ),
  };
}

function createCalibrationEnvironment(
  zone:
    BuildingZone,
): BuildingEnvironment {
  const collision =
    layoutAArchitectureV2Environment
      .zones
      .some(
        (
          existing,
        ) =>
          existing.id ===
          zone.id,
      );

  if (
    collision
  ) {
    throw new Error(
      `Temporary zone already exists: ${zone.id}`,
    );
  }

  return {
    ...layoutAArchitectureV2Environment,

    zones: [
      ...layoutAArchitectureV2Environment
        .zones,

      zone,
    ],
  };
}

function otherEndpoint(
  edge:
    NavigationEdge,
  nodeId:
    NavigationNodeId,
): NavigationNodeId |
  null {
  if (
    edge.from ===
    nodeId
  ) {
    return edge.to;
  }

  if (
    edge.bidirectional &&
    edge.to ===
      nodeId
  ) {
    return edge.from;
  }

  return null;
}

function endpointDetourExists(
  graph:
    NavigationGraph,
  targetEdge:
    NavigationEdge,
): boolean {
  const visited =
    new Set<
      NavigationNodeId
    >();

  const queue:
    NavigationNodeId[] =
  [
    targetEdge.from,
  ];

  visited.add(
    targetEdge.from,
  );

  while (
    queue.length >
    0
  ) {
    const current =
      queue.shift();

    if (!current) {
      break;
    }

    if (
      current ===
      targetEdge.to
    ) {
      return true;
    }

    for (
      const edge of
        graph.edges
    ) {
      if (
        edge.id ===
        targetEdge.id
      ) {
        continue;
      }

      const neighbor =
        otherEndpoint(
          edge,
          current,
        );

      if (
        neighbor ===
          null ||
        visited.has(
          neighbor,
        )
      ) {
        continue;
      }

      visited.add(
        neighbor,
      );

      queue.push(
        neighbor,
      );
    }
  }

  return false;
}

function runSimulation(
  scenario:
    ScenarioInstance,
  graph:
    NavigationGraph,
  environment:
    BuildingEnvironment,
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

    replayIntervalSeconds:
      RESEARCH_TIMESTEP_SECONDS,

    replayObserver,
  });
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
        event,
      ) =>
        event.id ===
        eventId,
    );
}

function runCandidate(
  candidate:
    typeof CANDIDATES[number],
): CandidateRun {
  const base =
    createArchitectureV2AuthoritativeBundle();

  const originalEdge =
    requireEdge(
      base.graph,
      candidate.edgeId,
    );

  const temporaryZoneId =
    `calibration-block-${candidate.id.toLowerCase()}`;

  const graph =
    createCalibrationGraph(
      base.graph,
      candidate.edgeId,
      temporaryZoneId,
    );

  const targetEdge =
    requireEdge(
      graph,
      candidate.edgeId,
    );

  const blockZone =
    createBlockZone(
      targetEdge,
      graph,
      temporaryZoneId,
    );

  const environment =
    createCalibrationEnvironment(
      blockZone,
    );

  const eventId =
    `corridor-target-${candidate.id.toLowerCase()}-block`;

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      `layout-a-v2-corridor-target-${candidate.id.toLowerCase()}-comparison`,

    parameterSetVersion:
      PARAMETER_SET_VERSION,

    disruptionSchedule: [
      {
        id:
          eventId,

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          ACTIVATION_TIME_SECONDS,

        targetId:
          temporaryZoneId,
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
      environment,
      (
        frame,
      ) => {
        frames.push(
          frame,
        );
      },
    );

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
      `No applied-event frame for candidate ${candidate.id}.`,
    );
  }

  const firstAppliedFrame =
    frames[
      firstAppliedIndex
    ];

  if (!firstAppliedFrame) {
    throw new Error(
      `Missing first applied frame for candidate ${candidate.id}.`,
    );
  }

  const preActivationFrame =
    firstAppliedIndex >
      0
      ? frames[
          firstAppliedIndex -
            1
        ]
      : undefined;

  if (!preActivationFrame) {
    throw new Error(
      `Missing pre-activation frame for candidate ${candidate.id}.`,
    );
  }

  if (
    originalEdge.zoneId ===
    targetEdge.zoneId
  ) {
    throw new Error(
      `Candidate ${candidate.id} target edge was not reassigned to its temporary block zone.`,
    );
  }

  return {
    candidateId:
      candidate.id,

    candidateLabel:
      candidate.label,

    targetEdge,

    temporaryZoneId,

    graph,

    result,

    preActivationFrame,

    firstAppliedFrame,

    endpointDetourExists:
      endpointDetourExists(
        graph,
        targetEdge,
      ),
  };
}

function countOnBlockedEdgeBefore(
  run:
    CandidateRun,
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
          run.targetEdge.id,
    )
    .length;
}

function countRemainingRoutesThroughEdge(
  run:
    CandidateRun,
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

        const remaining =
          route.edgeIds.slice(
            route.routeCursorIndex,
          );

        return remaining.includes(
          run.targetEdge.id,
        );
      },
    )
    .length;
}

function countRouteBlockedReviews(
  run:
    CandidateRun,
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
          ACTIVATION_TIME_SECONDS &&
        entry.reasonCodes.includes(
          "ROUTE_BLOCKED",
        ),
    )
    .length;
}

function countChangedRoutes(
  run:
    CandidateRun,
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
          ACTIVATION_TIME_SECONDS &&
        entry.routeChanged,
    )
    .length;
}

const base =
  createArchitectureV2AuthoritativeBundle();

const baselineScenario:
  ScenarioInstance = {
  ...base.scenario,

  id:
    "layout-a-v2-corridor-target-comparison-baseline",

  parameterSetVersion:
    PARAMETER_SET_VERSION,

  disruptionSchedule:
    [],
};

const baseline =
  runSimulation(
    baselineScenario,
    base.graph,
    layoutAArchitectureV2Environment,
  );

const runs =
  CANDIDATES.map(
    runCandidate,
  );

console.log(
  "\n=== ARCHITECTURE V2 D3 CORRIDOR TARGET COMPARISON ===\n",
);

console.log(
  `Comparison block time: ${ACTIVATION_TIME_SECONDS.toFixed(2)} s`,
);

console.log(
  `Occupancy: ${baseline.metrics.totalAgents}`,
);

console.log(
  "Strategy: ADAPTIVE_HYBRID",
);

console.log(
  "\n=== D0 REFERENCE ===\n",
);

console.table([
  {
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

    tetSeconds:
      baseline
        .metrics
        .totalEvacuationTimeSeconds,

    maximumDensity:
      baseline
        .metrics
        .maximumLocalDensityPersonsPerSquareMeter,

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
  "\n=== CANDIDATE RESULTS ===\n",
);

console.table(
  runs.map(
    (
      run,
    ) => ({
      candidate:
        run.candidateId,

      label:
        run.candidateLabel,

      edgeId:
        run.targetEdge.id,

      from:
        run.targetEdge.from,

      to:
        run.targetEdge.to,

      endpointDetourExists:
        run.endpointDetourExists,

      evacuatedBeforeBlock:
        run
          .preActivationFrame
          .metrics
          .evacuatedAgents,

      activeBeforeBlock:
        run
          .preActivationFrame
          .metrics
          .activeAgents,

      onBlockedEdgeBefore:
        countOnBlockedEdgeBefore(
          run,
        ),

      remainingRoutesThroughEdge:
        countRemainingRoutesThroughEdge(
          run,
        ),

      completionPercent:
        Number(
          (
            run
              .result
              .metrics
              .completionRate *
            100
          ).toFixed(
            1,
          ),
        ),

      tetSeconds:
        run
          .result
          .metrics
          .totalEvacuationTimeSeconds,

      p95Seconds:
        run
          .result
          .metrics
          .p95EvacuationTimeSeconds,

      maximumDensity:
        run
          .result
          .metrics
          .maximumLocalDensityPersonsPerSquareMeter,

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
        run
          .result
          .metrics
          .totalReroutes,

      routeBlockedReviews:
        countRouteBlockedReviews(
          run,
        ),

      changedRoutesAfterBlock:
        countChangedRoutes(
          run,
        ),

      unreachable:
        run
          .result
          .metrics
          .unreachableAgents,

      timeouts:
        run
          .result
          .metrics
          .timeoutAgents,
    }),
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
            candidate:
              run.candidateId,

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
  "\n=== END D3 CORRIDOR TARGET COMPARISON ===\n",
);