import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../src/experiment/architectureV2FormalExperimentDesign";

import {
  createArchitectureV2FormalScenario,
} from "../src/scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../src/scenario/architectureV2ResearchParameterSet";

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
  RoutingStrategyId,
} from "../src/types/routingStrategy";

import type {
  ScenarioInstance,
} from "../src/types/scenario";

const CONFIRMATION_VERSION =
  "architecture-v2-d5-d6-confirmation-v1";

const POPULATION_LEVEL =
  "MEDIUM" as const;

const VALIDATION_SEEDS =
  Object.freeze([
    930001,
    930002,
    930003,
    930004,
    930005,
    930006,
    930007,
    930008,
    930009,
    930010,
  ] as const);

const D5_EXIT_ID =
  "exit-west";

const D5_ACTIVATION_TIME_SECONDS =
  18;

const D6_EDGE_ID =
  "edge-main-east-main-southeast";

const D6_ACTIVATION_TIME_SECONDS =
  12;

const MAXIMUM_SIMULATION_TIME_SECONDS =
  180;

type ConfirmationConditionId =
  | "D5_EXIT_WEST"
  | "D6_CORRIDOR_EAST_SOUTHEAST";

interface ConfirmationRecord {
  readonly conditionId:
    ConfirmationConditionId;

  readonly replicationSeed:
    number;

  readonly strategyId:
    RoutingStrategyId;

  readonly baselineEvacuationTimeSeconds:
    number;

  readonly candidateEvacuationTimeSeconds:
    number;

  readonly evacuationTimeDeltaSeconds:
    number;

  readonly totalReroutes:
    number;

  readonly exitTargetChanges:
    number;

  readonly routeReversals:
    number;
}

interface ConfirmationSummaryRow {
  readonly condition:
    ConfirmationConditionId;

  readonly strategy:
    RoutingStrategyId;

  readonly runs:
    number;

  readonly meanEvacDeltaS:
    number;

  readonly minEvacDeltaS:
    number;

  readonly maxEvacDeltaS:
    number;

  readonly meanReroutes:
    number;

  readonly meanExitChanges:
    number;

  readonly meanReversals:
    number;
}

interface OverallSummaryRow {
  readonly condition:
    ConfirmationConditionId;

  readonly runs:
    number;

  readonly meanEvacDeltaS:
    number;

  readonly minEvacDeltaS:
    number;

  readonly maxEvacDeltaS:
    number;

  readonly meanReroutes:
    number;

  readonly meanExitChanges:
    number;

  readonly meanReversals:
    number;
}

function mean(
  values:
    readonly number[],
): number {
  if (
    values.length ===
    0
  ) {
    throw new Error(
      "Cannot calculate mean from an empty collection.",
    );
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total +
        value,
      0,
    ) /
    values.length
  );
}

function round(
  value:
    number,
  digits =
    2,
): number {
  const factor =
    10 ** digits;

  return (
    Math.round(
      value *
      factor,
    ) /
    factor
  );
}

function baselineKey(
  replicationSeed:
    number,

  strategyId:
    RoutingStrategyId,
): string {
  return `${replicationSeed}|${strategyId}`;
}

function requireEdge(
  graph:
    NavigationGraph,

  edgeId:
    string,
): NavigationEdge {
  const edge =
    graph.edges.find(
      (
        candidate,
      ) =>
        candidate.id ===
        edgeId,
    );

  if (!edge) {
    throw new Error(
      `Confirmation corridor edge not found: ${edgeId}`,
    );
  }

  return edge;
}

function createDedicatedCorridorZone(
  graph:
    NavigationGraph,

  edge:
    NavigationEdge,

  zoneId:
    string,
): BuildingZone {
  const fromNode =
    graph.nodes.find(
      (
        node,
      ) =>
        node.id ===
        edge.from,
    );

  const toNode =
    graph.nodes.find(
      (
        node,
      ) =>
        node.id ===
        edge.to,
    );

  if (
    !fromNode ||
    !toNode
  ) {
    throw new Error(
      `Cannot construct confirmation zone for edge ${edge.id}.`,
    );
  }

  const dx =
    toNode.position.x -
    fromNode.position.x;

  const dy =
    toNode.position.y -
    fromNode.position.y;

  const length =
    Math.hypot(
      dx,
      dy,
    );

  if (
    length <=
    0
  ) {
    throw new Error(
      `Confirmation edge ${edge.id} has zero geometric length.`,
    );
  }

  const halfWidth =
    edge.widthMeters /
    2;

  const normalX =
    (-dy /
      length) *
    halfWidth;

  const normalY =
    (dx /
      length) *
    halfWidth;

  return {
    id:
      zoneId,

    type:
      "CORRIDOR",

    polygon: {
      vertices: [
        {
          x:
            fromNode.position.x +
            normalX,

          y:
            fromNode.position.y +
            normalY,
        },

        {
          x:
            toNode.position.x +
            normalX,

          y:
            toNode.position.y +
            normalY,
        },

        {
          x:
            toNode.position.x -
            normalX,

          y:
            toNode.position.y -
            normalY,
        },

        {
          x:
            fromNode.position.x -
            normalX,

          y:
            fromNode.position.y -
            normalY,
        },
      ],
    },
  };
}

function createD6Model(
  baseEnvironment:
    BuildingEnvironment,

  baseGraph:
    NavigationGraph,
): {
  readonly environment:
    BuildingEnvironment;

  readonly graph:
    NavigationGraph;

  readonly zoneId:
    string;
} {
  const targetEdge =
    requireEdge(
      baseGraph,
      D6_EDGE_ID,
    );

  const zoneId =
    "corridor-main-east-southeast-blockable";

  const blockZone =
    createDedicatedCorridorZone(
      baseGraph,
      targetEdge,
      zoneId,
    );

  const environment:
    BuildingEnvironment = {
    ...baseEnvironment,

    zones: [
      ...baseEnvironment.zones,
      blockZone,
    ],
  };

  const graph:
    NavigationGraph = {
    ...baseGraph,

    nodes:
      baseGraph.nodes,

    edges:
      baseGraph.edges.map(
        (
          edge,
        ) => {
          if (
            edge.id !==
            D6_EDGE_ID
          ) {
            return edge;
          }

          return {
            ...edge,

            zoneId,
          };
        },
      ),
  };

  return {
    environment,
    graph,
    zoneId,
  };
}

function createD5Scenario(
  baseScenario:
    ScenarioInstance,
): ScenarioInstance {
  return {
    ...baseScenario,

    id:
      `${baseScenario.id}__d5-confirmation`,

    parameterSetVersion:
      CONFIRMATION_VERSION,

    disruptionSchedule: [
      {
        id:
          "confirmation-d5-west-exit-block",

        type:
          "EXIT_BLOCK",

        activationTimeSeconds:
          D5_ACTIVATION_TIME_SECONDS,

        targetId:
          D5_EXIT_ID,
      },
    ],
  };
}

function createD6Scenario(
  baseScenario:
    ScenarioInstance,

  zoneId:
    string,
): ScenarioInstance {
  return {
    ...baseScenario,

    id:
      `${baseScenario.id}__d6-confirmation`,

    parameterSetVersion:
      CONFIRMATION_VERSION,

    disruptionSchedule: [
      {
        id:
          "confirmation-d6-east-southeast-corridor-block",

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds:
          D6_ACTIVATION_TIME_SECONDS,

        targetId:
          zoneId,
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

  bundle:
    ReturnType<
      typeof createArchitectureV2FormalScenario
    >,

  strategyId:
    RoutingStrategyId,
): HeadlessSimulationResult {
  return runHeadlessSimulation({
    scenario,

    environment,

    graph,

    exits:
      bundle.exits,

    spawnZones:
      bundle.spawnZones,

    configuration: {
      strategyId,

      timestepSeconds:
        ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds:
        MAXIMUM_SIMULATION_TIME_SECONDS,

      densityCellLengthMeters:
        ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  });
}

function requireSuccessfulRun(
  result:
    HeadlessSimulationResult,

  label:
    string,
): number {
  if (
    result.metrics
      .completionRate !==
      1
  ) {
    throw new Error(
      `${label}: completion rate was ${result.metrics.completionRate}.`,
    );
  }

  if (
    result.metrics
      .unreachableAgents !==
      0
  ) {
    throw new Error(
      `${label}: unreachable occupants were present.`,
    );
  }

  if (
    result.metrics
      .timeoutAgents !==
      0
  ) {
    throw new Error(
      `${label}: timeout occupants were present.`,
    );
  }

  const evacuationTime =
    result.metrics
      .totalEvacuationTimeSeconds;

  if (
    evacuationTime ===
    null
  ) {
    throw new Error(
      `${label}: total evacuation time was null.`,
    );
  }

  return evacuationTime;
}

function requireSingleAppliedEvent(
  result:
    HeadlessSimulationResult,

  label:
    string,
): void {
  if (
    result.appliedDisruptions
      .length !==
    1
  ) {
    throw new Error(
      `${label}: expected exactly one applied disruption, found ${result.appliedDisruptions.length}.`,
    );
  }
}

function createRecord(
  conditionId:
    ConfirmationConditionId,

  replicationSeed:
    number,

  strategyId:
    RoutingStrategyId,

  baseline:
    HeadlessSimulationResult,

  candidate:
    HeadlessSimulationResult,
): ConfirmationRecord {
  const baselineTime =
    requireSuccessfulRun(
      baseline,
      `${conditionId} baseline ${replicationSeed}/${strategyId}`,
    );

  const candidateTime =
    requireSuccessfulRun(
      candidate,
      `${conditionId} candidate ${replicationSeed}/${strategyId}`,
    );

  requireSingleAppliedEvent(
    candidate,
    `${conditionId} candidate ${replicationSeed}/${strategyId}`,
  );

  return {
    conditionId,

    replicationSeed,

    strategyId,

    baselineEvacuationTimeSeconds:
      baselineTime,

    candidateEvacuationTimeSeconds:
      candidateTime,

    evacuationTimeDeltaSeconds:
      candidateTime -
      baselineTime,

    totalReroutes:
      candidate.metrics
        .totalReroutes,

    exitTargetChanges:
      candidate.routeStability
        .totalExitTargetChanges,

    routeReversals:
      candidate.routeStability
        .totalRouteReversalEvents,
  };
}

function summarizeByStrategy(
  records:
    readonly ConfirmationRecord[],
): readonly ConfirmationSummaryRow[] {
  const rows:
    ConfirmationSummaryRow[] =
  [];

  const conditions:
    readonly ConfirmationConditionId[] =
  [
    "D5_EXIT_WEST",
    "D6_CORRIDOR_EAST_SOUTHEAST",
  ];

  for (
    const condition of
      conditions
  ) {
    for (
      const strategy of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const sample =
        records.filter(
          (
            record,
          ) =>
            record.conditionId ===
              condition &&
            record.strategyId ===
              strategy,
        );

      const deltas =
        sample.map(
          (
            record,
          ) =>
            record.evacuationTimeDeltaSeconds,
        );

      rows.push({
        condition,

        strategy,

        runs:
          sample.length,

        meanEvacDeltaS:
          round(
            mean(
              deltas,
            ),
          ),

        minEvacDeltaS:
          round(
            Math.min(
              ...deltas,
            ),
          ),

        maxEvacDeltaS:
          round(
            Math.max(
              ...deltas,
            ),
          ),

        meanReroutes:
          round(
            mean(
              sample.map(
                (
                  record,
                ) =>
                  record.totalReroutes,
              ),
            ),
          ),

        meanExitChanges:
          round(
            mean(
              sample.map(
                (
                  record,
                ) =>
                  record.exitTargetChanges,
              ),
            ),
          ),

        meanReversals:
          round(
            mean(
              sample.map(
                (
                  record,
                ) =>
                  record.routeReversals,
              ),
            ),
          ),
      });
    }
  }

  return rows;
}

function summarizeOverall(
  records:
    readonly ConfirmationRecord[],
): readonly OverallSummaryRow[] {
  const conditions:
    readonly ConfirmationConditionId[] =
  [
    "D5_EXIT_WEST",
    "D6_CORRIDOR_EAST_SOUTHEAST",
  ];

  return conditions.map(
    (
      condition,
    ) => {
      const sample =
        records.filter(
          (
            record,
          ) =>
            record.conditionId ===
            condition,
        );

      const deltas =
        sample.map(
          (
            record,
          ) =>
            record.evacuationTimeDeltaSeconds,
        );

      return {
        condition,

        runs:
          sample.length,

        meanEvacDeltaS:
          round(
            mean(
              deltas,
            ),
          ),

        minEvacDeltaS:
          round(
            Math.min(
              ...deltas,
            ),
          ),

        maxEvacDeltaS:
          round(
            Math.max(
              ...deltas,
            ),
          ),

        meanReroutes:
          round(
            mean(
              sample.map(
                (
                  record,
                ) =>
                  record.totalReroutes,
              ),
            ),
          ),

        meanExitChanges:
          round(
            mean(
              sample.map(
                (
                  record,
                ) =>
                  record.exitTargetChanges,
              ),
            ),
          ),

        meanReversals:
          round(
            mean(
              sample.map(
                (
                  record,
                ) =>
                  record.routeReversals,
              ),
            ),
          ),
      };
    },
  );
}

function main():
  void {
  console.log(
    "Architecture V2 D5/D6 independent confirmation",
  );

  console.log(
    "==============================================",
  );

  console.log(
    `D5: ${D5_EXIT_ID} block at ${D5_ACTIVATION_TIME_SECONDS} s`,
  );

  console.log(
    `D6: ${D6_EDGE_ID} block at ${D6_ACTIVATION_TIME_SECONDS} s`,
  );

  console.log(
    "",
  );

  console.log(
    "Creating independent baseline runs...",
  );

  const baselineByKey =
    new Map<
      string,
      HeadlessSimulationResult
    >();

  for (
    const replicationSeed of
      VALIDATION_SEEDS
  ) {
    for (
      const strategyId of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const bundle =
        createArchitectureV2FormalScenario({
          populationLevel:
            POPULATION_LEVEL,

          conditionId:
            "D0_BASELINE",

          replicationSeed,
        });

      const result =
        runSimulation(
          bundle.scenario,
          bundle.environment,
          bundle.graph,
          bundle,
          strategyId,
        );

      requireSuccessfulRun(
        result,
        `Baseline ${replicationSeed}/${strategyId}`,
      );

      baselineByKey.set(
        baselineKey(
          replicationSeed,
          strategyId,
        ),
        result,
      );
    }
  }

  const records:
    ConfirmationRecord[] =
  [];

  console.log(
    "Confirming D5...",
  );

  for (
    const replicationSeed of
      VALIDATION_SEEDS
  ) {
    for (
      const strategyId of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const bundle =
        createArchitectureV2FormalScenario({
          populationLevel:
            POPULATION_LEVEL,

          conditionId:
            "D0_BASELINE",

          replicationSeed,
        });

      const baseline =
        baselineByKey.get(
          baselineKey(
            replicationSeed,
            strategyId,
          ),
        );

      if (!baseline) {
        throw new Error(
          "Missing D5 baseline result.",
        );
      }

      const scenario =
        createD5Scenario(
          bundle.scenario,
        );

      const candidate =
        runSimulation(
          scenario,
          bundle.environment,
          bundle.graph,
          bundle,
          strategyId,
        );

      records.push(
        createRecord(
          "D5_EXIT_WEST",
          replicationSeed,
          strategyId,
          baseline,
          candidate,
        ),
      );
    }
  }

  console.log(
    "Confirming D6...",
  );

  for (
    const replicationSeed of
      VALIDATION_SEEDS
  ) {
    for (
      const strategyId of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const bundle =
        createArchitectureV2FormalScenario({
          populationLevel:
            POPULATION_LEVEL,

          conditionId:
            "D0_BASELINE",

          replicationSeed,
        });

      const baseline =
        baselineByKey.get(
          baselineKey(
            replicationSeed,
            strategyId,
          ),
        );

      if (!baseline) {
        throw new Error(
          "Missing D6 baseline result.",
        );
      }

      const model =
        createD6Model(
          bundle.environment,
          bundle.graph,
        );

      const scenario =
        createD6Scenario(
          bundle.scenario,
          model.zoneId,
        );

      const candidate =
        runSimulation(
          scenario,
          model.environment,
          model.graph,
          bundle,
          strategyId,
        );

      records.push(
        createRecord(
          "D6_CORRIDOR_EAST_SOUTHEAST",
          replicationSeed,
          strategyId,
          baseline,
          candidate,
        ),
      );
    }
  }

  const expectedCandidateRuns =
    VALIDATION_SEEDS.length *
    ARCHITECTURE_V2_FORMAL_STRATEGY_IDS.length *
    2;

  if (
    records.length !==
    expectedCandidateRuns
  ) {
    throw new Error(
      `Expected ${expectedCandidateRuns} confirmation runs, found ${records.length}.`,
    );
  }

  console.log(
    "",
  );

  console.log(
    "PER-STRATEGY CONFIRMATION",
  );

  console.table(
    summarizeByStrategy(
      records,
    ),
  );

  console.log(
    "",
  );

  console.log(
    "OVERALL CONFIRMATION",
  );

  console.table(
    summarizeOverall(
      records,
    ),
  );

  console.log(
    "",
  );

  console.log(
    `All ${expectedCandidateRuns} D5/D6 confirmation runs completed successfully.`,
  );

  console.log(
    "No unreachable or timeout occupants were detected.",
  );

  console.log(
    "D5/D6 are ready for formalization if the confirmation effects remain meaningful.",
  );
}

main();