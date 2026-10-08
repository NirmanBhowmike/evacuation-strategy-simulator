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

const CALIBRATION_VERSION =
  "architecture-v2-d5-d6-calibration-v1";

const POPULATION_LEVEL =
  "MEDIUM" as const;

const CALIBRATION_SEEDS =
  Object.freeze([
    920001,
    920002,
    920003,
    920004,
    920005,
  ] as const);

const EXIT_CANDIDATES =
  Object.freeze([
    "exit-west",
    "exit-east",
    "exit-southeast",
  ] as const);

const EXIT_TIMES =
  Object.freeze([
    12,
    18,
    24,
  ] as const);

const CORRIDOR_CANDIDATES =
  Object.freeze([
    "edge-west-corridor-main",
    "edge-east-02-main-east-end",
    "edge-main-open-central",
    "edge-main-east-main-southeast",
  ] as const);

const CORRIDOR_TIMES =
  Object.freeze([
    8,
    12,
    18,
  ] as const);

const MAXIMUM_SIMULATION_TIME_SECONDS =
  180;

interface BaselineRecord {
  readonly replicationSeed:
    number;

  readonly strategyId:
    RoutingStrategyId;

  readonly result:
    HeadlessSimulationResult;
}

interface CalibrationRecord {
  readonly candidateType:
    "EXIT_BLOCK" | "CORRIDOR_BLOCK";

  readonly candidateId:
    string;

  readonly activationTimeSeconds:
    number;

  readonly replicationSeed:
    number;

  readonly strategyId:
    RoutingStrategyId;

  readonly completionRate:
    number;

  readonly unreachableAgents:
    number;

  readonly timeoutAgents:
    number;

  readonly totalEvacuationTimeSeconds:
    number | null;

  readonly baselineTotalEvacuationTimeSeconds:
    number;

  readonly evacuationTimeDeltaSeconds:
    number | null;

  readonly totalReroutes:
    number;

  readonly exitTargetChanges:
    number;

  readonly routeReversals:
    number;

  readonly appliedDisruptionCount:
    number;
}

function baselineKey(
  replicationSeed:
    number,

  strategyId:
    RoutingStrategyId,
): string {
  return `${replicationSeed}|${strategyId}`;
}

function mean(
  values:
    readonly number[],
): number {
  if (
    values.length ===
    0
  ) {
    return 0;
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
      `Calibration corridor edge not found: ${edgeId}`,
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
      `Cannot create calibration zone for edge ${edge.id}.`,
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
      `Calibration edge ${edge.id} has zero geometric length.`,
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

function createCorridorCalibrationModel(
  baseEnvironment:
    BuildingEnvironment,

  baseGraph:
    NavigationGraph,

  edgeId:
    string,
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
      edgeId,
    );

  const zoneId =
    `calibration-block-${edgeId}`;

  if (
    baseEnvironment.zones.some(
      (
        zone,
      ) =>
        zone.id ===
        zoneId,
    )
  ) {
    throw new Error(
      `Duplicate calibration zone: ${zoneId}`,
    );
  }

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
            edgeId
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

function createExitScenario(
  baseScenario:
    ScenarioInstance,

  exitId:
    string,

  activationTimeSeconds:
    number,
): ScenarioInstance {
  return {
    ...baseScenario,

    id:
      `${baseScenario.id}__cal-exit-${exitId}-${activationTimeSeconds}s`,

    parameterSetVersion:
      CALIBRATION_VERSION,

    disruptionSchedule: [
      {
        id:
          `cal-exit-${exitId}-${activationTimeSeconds}s`,

        type:
          "EXIT_BLOCK",

        activationTimeSeconds,

        targetId:
          exitId,
      },
    ],
  };
}

function createCorridorScenario(
  baseScenario:
    ScenarioInstance,

  edgeId:
    string,

  zoneId:
    string,

  activationTimeSeconds:
    number,
): ScenarioInstance {
  return {
    ...baseScenario,

    id:
      `${baseScenario.id}__cal-corridor-${edgeId}-${activationTimeSeconds}s`,

    parameterSetVersion:
      CALIBRATION_VERSION,

    disruptionSchedule: [
      {
        id:
          `cal-corridor-${edgeId}-${activationTimeSeconds}s`,

        type:
          "CORRIDOR_BLOCK",

        activationTimeSeconds,

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

function createCalibrationRecord(
  candidateType:
    "EXIT_BLOCK" | "CORRIDOR_BLOCK",

  candidateId:
    string,

  activationTimeSeconds:
    number,

  replicationSeed:
    number,

  strategyId:
    RoutingStrategyId,

  result:
    HeadlessSimulationResult,

  baseline:
    HeadlessSimulationResult,
): CalibrationRecord {
  const baselineTime =
    baseline.metrics
      .totalEvacuationTimeSeconds;

  if (
    baselineTime ===
    null
  ) {
    throw new Error(
      `Baseline run did not complete for seed ${replicationSeed}, strategy ${strategyId}.`,
    );
  }

  const candidateTime =
    result.metrics
      .totalEvacuationTimeSeconds;

  return {
    candidateType,

    candidateId,

    activationTimeSeconds,

    replicationSeed,

    strategyId,

    completionRate:
      result.metrics
        .completionRate,

    unreachableAgents:
      result.metrics
        .unreachableAgents,

    timeoutAgents:
      result.metrics
        .timeoutAgents,

    totalEvacuationTimeSeconds:
      candidateTime,

    baselineTotalEvacuationTimeSeconds:
      baselineTime,

    evacuationTimeDeltaSeconds:
      candidateTime ===
      null
        ? null
        : candidateTime -
          baselineTime,

    totalReroutes:
      result.metrics
        .totalReroutes,

    exitTargetChanges:
      result.routeStability
        .totalExitTargetChanges,

    routeReversals:
      result.routeStability
        .totalRouteReversalEvents,

    appliedDisruptionCount:
      result.appliedDisruptions
        .length,
  };
}

function summarize(
  records:
    readonly CalibrationRecord[],
): readonly object[] {
  const groups =
    new Map<
      string,
      CalibrationRecord[]
    >();

  for (
    const record of
      records
  ) {
    const key =
      [
        record.candidateType,
        record.candidateId,
        record.activationTimeSeconds,
      ].join(
        "|",
      );

    const current =
      groups.get(
        key,
      ) ?? [];

    current.push(
      record,
    );

    groups.set(
      key,
      current,
    );
  }

  return [
    ...groups.values(),
  ].map(
    (
      sample,
    ) => {
      const first =
        sample[0];

      if (!first) {
        throw new Error(
          "Unexpected empty calibration sample.",
        );
      }

      const completed =
        sample.filter(
          (
            record,
          ) =>
            record.completionRate ===
            1,
        );

      const validDeltas =
        sample.flatMap(
          (
            record,
          ) =>
            record.evacuationTimeDeltaSeconds ===
            null
              ? []
              : [
                  record.evacuationTimeDeltaSeconds,
                ],
        );

      return {
        type:
          first.candidateType,

        target:
          first.candidateId,

        timeS:
          first.activationTimeSeconds,

        runs:
          sample.length,

        completed:
          completed.length,

        unreachableRuns:
          sample.filter(
            (
              record,
            ) =>
              record.unreachableAgents >
              0,
          ).length,

        timeoutRuns:
          sample.filter(
            (
              record,
            ) =>
              record.timeoutAgents >
              0,
          ).length,

        eventAppliedRuns:
          sample.filter(
            (
              record,
            ) =>
              record.appliedDisruptionCount >
              0,
          ).length,

        meanEvacDeltaS:
          round(
            mean(
              validDeltas,
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
  const baselineByKey =
    new Map<
      string,
      BaselineRecord
    >();

  const calibrationRecords:
    CalibrationRecord[] =
  [];

  console.log(
    "Creating baseline comparison runs...",
  );

  for (
    const replicationSeed of
      CALIBRATION_SEEDS
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

      if (
        result.metrics
          .completionRate !==
        1
      ) {
        throw new Error(
          `Baseline calibration failure for ${replicationSeed}/${strategyId}.`,
        );
      }

      baselineByKey.set(
        baselineKey(
          replicationSeed,
          strategyId,
        ),
        {
          replicationSeed,
          strategyId,
          result,
        },
      );
    }
  }

  console.log(
    "Calibrating D5 exit-block candidates...",
  );

  for (
    const exitId of
      EXIT_CANDIDATES
  ) {
    for (
      const activationTimeSeconds of
        EXIT_TIMES
    ) {
      for (
        const replicationSeed of
          CALIBRATION_SEEDS
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

          const baselineRecord =
            baselineByKey.get(
              baselineKey(
                replicationSeed,
                strategyId,
              ),
            );

          if (!baselineRecord) {
            throw new Error(
              "Missing baseline calibration record.",
            );
          }

          const scenario =
            createExitScenario(
              bundle.scenario,
              exitId,
              activationTimeSeconds,
            );

          const result =
            runSimulation(
              scenario,
              bundle.environment,
              bundle.graph,
              bundle,
              strategyId,
            );

          calibrationRecords.push(
            createCalibrationRecord(
              "EXIT_BLOCK",
              exitId,
              activationTimeSeconds,
              replicationSeed,
              strategyId,
              result,
              baselineRecord.result,
            ),
          );
        }
      }
    }
  }

  console.log(
    "Calibrating D6 corridor-block candidates...",
  );

  for (
    const edgeId of
      CORRIDOR_CANDIDATES
  ) {
    for (
      const activationTimeSeconds of
        CORRIDOR_TIMES
    ) {
      for (
        const replicationSeed of
          CALIBRATION_SEEDS
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

          const baselineRecord =
            baselineByKey.get(
              baselineKey(
                replicationSeed,
                strategyId,
              ),
            );

          if (!baselineRecord) {
            throw new Error(
              "Missing baseline calibration record.",
            );
          }

          const model =
            createCorridorCalibrationModel(
              bundle.environment,
              bundle.graph,
              edgeId,
            );

          const scenario =
            createCorridorScenario(
              bundle.scenario,
              edgeId,
              model.zoneId,
              activationTimeSeconds,
            );

          const result =
            runSimulation(
              scenario,
              model.environment,
              model.graph,
              bundle,
              strategyId,
            );

          calibrationRecords.push(
            createCalibrationRecord(
              "CORRIDOR_BLOCK",
              edgeId,
              activationTimeSeconds,
              replicationSeed,
              strategyId,
              result,
              baselineRecord.result,
            ),
          );
        }
      }
    }
  }

  const summary =
    summarize(
      calibrationRecords,
    );

  console.log(
    "",
  );

  console.log(
    "D5 / D6 CALIBRATION SUMMARY",
  );

  console.log(
    "===========================",
  );

  console.log(
    "",
  );

  console.log(
    "D5 EXIT-BLOCK CANDIDATES",
  );

  console.table(
    summary.filter(
      (
        row,
      ) =>
        (
          row as {
            type:
              string;
          }
        ).type ===
        "EXIT_BLOCK",
    ),
  );

  console.log(
    "",
  );

  console.log(
    "D6 CORRIDOR-BLOCK CANDIDATES",
  );

  console.table(
    summary.filter(
      (
        row,
      ) =>
        (
          row as {
            type:
              string;
          }
        ).type ===
        "CORRIDOR_BLOCK",
    ),
  );

  console.log(
    "",
  );

  console.log(
    "Calibration only. No formal D5/D6 parameter has been frozen.",
  );
}

main();