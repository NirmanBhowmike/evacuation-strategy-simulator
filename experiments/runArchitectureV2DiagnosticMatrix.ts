import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";

import {
  join,
  resolve,
} from "node:path";

import {
  pathToFileURL,
} from "node:url";

import {
  runHeadlessSimulation,
} from "../src/core/runHeadlessSimulation";

import {
  ARCHITECTURE_V2_FORMAL_CONDITION_IDS,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../src/experiment/architectureV2FormalExperimentDesign";

import {
  ARCHITECTURE_V2_FORMAL_MAXIMUM_SIMULATION_TIME_SECONDS,
} from "../src/experiment/architectureV2FormalExperimentRunner";

import {
  createArchitectureV2FormalScenario,
  ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,
} from "../src/scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../src/scenario/architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../src/scenario/architectureV2ResearchParameterSet";

import type {
  RoutingStrategyId,
} from "../src/types/routingStrategy";

import type {
  ExitUtilizationMetric,
} from "../src/types/metrics";

import {
  createArchitectureV2FormalRepositoryProvenance,
} from "./architectureV2FormalCliSupport";

import type {
  ArchitectureV2FormalRepositoryProvenance,
} from "./architectureV2FormalCliSupport";

export const ARCHITECTURE_V2_DIAGNOSTIC_MATRIX_VERSION =
  "architecture-v2-diagnostic-matrix-v2";

export const ARCHITECTURE_V2_DIAGNOSTIC_SEEDS =
  Object.freeze([
    900001,
    900002,
    900003,
    900004,
    900005,
  ] as const);

export const ARCHITECTURE_V2_DIAGNOSTIC_POPULATION_LEVEL =
  "MEDIUM" as const;

export const ARCHITECTURE_V2_DIAGNOSTIC_RUN_RECORDS_FILENAME =
  "diagnostic-run-records.csv";

export const ARCHITECTURE_V2_DIAGNOSTIC_STRATEGY_SUMMARY_FILENAME =
  "diagnostic-strategy-summary.csv";

export const ARCHITECTURE_V2_DIAGNOSTIC_SUMMARY_FILENAME =
  "diagnostic-summary.json";

export interface ArchitectureV2DiagnosticPairRequest {
  readonly populationLevel:
    typeof ARCHITECTURE_V2_DIAGNOSTIC_POPULATION_LEVEL;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly replicationSeed:
    number;

  readonly pairKey:
    string;
}

export type ArchitectureV2DiagnosticRunStatus =
  | "COMPLETED"
  | "UNREACHABLE_PRESENT"
  | "TIMEOUT";

export interface ArchitectureV2DiagnosticRunRecord {
  readonly diagnosticVersion:
    string;

  readonly runId:
    string;

  readonly pairKey:
    string;

  readonly softwareVersion:
    string;

  readonly gitCommit:
    string;

  readonly parameterSetVersion:
    string;

  readonly speedAssignmentVersion:
    string;

  readonly scenarioId:
    string;

  readonly populationLevel:
    "MEDIUM";

  readonly population:
    number;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly replicationSeed:
    number;

  readonly strategyId:
    RoutingStrategyId;

  readonly runStatus:
    ArchitectureV2DiagnosticRunStatus;

  readonly terminationReason:
    "ALL_RESOLVED"
    | "TIMEOUT"
    | null;

  readonly appliedDisruptionCount:
    number;

  readonly totalEvacuationTimeSeconds:
    number | null;

  readonly meanEvacuationTimeSeconds:
    number | null;

  readonly p95EvacuationTimeSeconds:
    number | null;

  readonly populationHazardExposurePersonSeconds:
    number;

  readonly maximumLocalDensityPersonsPerSquareMeter:
    number | null;

  readonly populationQueueWaitPersonSeconds:
    number;

  readonly meanQueueWaitSeconds:
    number;

  readonly maximumQueueWaitSeconds:
    number;

  readonly completionRate:
    number;

  readonly unreachableAgents:
    number;

  readonly timeoutAgents:
    number;

  readonly meanTravelDistanceMeters:
    number;

  readonly totalReroutes:
    number;

  readonly totalAcceptedReroutes:
    number;

  readonly totalExitTargetChanges:
    number;

  readonly totalRouteReversalEvents:
    number;

  readonly exitUtilization:
    readonly ExitUtilizationMetric[];
}

export interface ArchitectureV2DiagnosticStrategyAggregate {
  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly strategyId:
    RoutingStrategyId;

  readonly sampleCount:
    number;

  readonly completedCount:
    number;

  readonly meanTotalEvacuationTimeSeconds:
    number | null;

  readonly meanP95EvacuationTimeSeconds:
    number | null;

  readonly meanHazardExposurePersonSeconds:
    number;

  readonly meanQueueExposurePersonSeconds:
    number;

  readonly meanMaximumDensityPersonsPerSquareMeter:
    number | null;

  readonly meanReroutes:
    number;

  readonly meanExitTargetChanges:
    number;

  readonly meanRouteReversalEvents:
    number;
}

export interface ArchitectureV2AdaptiveHazardDiagnosticComparison {
  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly replicationCount:
    number;

  readonly identicalMeasuredOutcomeReplications:
    number;

  readonly differingMeasuredOutcomeReplications:
    number;

  readonly allMeasuredOutcomesIdentical:
    boolean;

  readonly meanAdaptiveMinusHazardTotalEvacuationTimeSeconds:
    number | null;

  readonly meanAdaptiveMinusHazardExposurePersonSeconds:
    number;

  readonly meanAdaptiveMinusHazardQueueExposurePersonSeconds:
    number;

  readonly meanAdaptiveMinusHazardReroutes:
    number;

  readonly meanAdaptiveMinusHazardExitTargetChanges:
    number;

  readonly meanAdaptiveMinusHazardRouteReversals:
    number;
}

export interface ArchitectureV2DiagnosticSummary {
  readonly diagnosticVersion:
    string;

  readonly softwareVersion:
    string;

  readonly gitCommit:
    string;

  readonly parameterSetVersion:
    string;

  readonly speedAssignmentVersion:
    string;

  readonly populationLevel:
    "MEDIUM";

  readonly replicationSeeds:
    readonly number[];

  readonly conditionIds:
    readonly ArchitectureV2ResearchDisruptionConditionId[];

  readonly strategyIds:
    readonly RoutingStrategyId[];

  readonly totalPairs:
    number;

  readonly totalRuns:
    number;

  readonly completedRunCount:
    number;

  readonly unreachablePresentRunCount:
    number;

  readonly timeoutRunCount:
    number;

  readonly strategyAggregates:
    readonly ArchitectureV2DiagnosticStrategyAggregate[];

  readonly adaptiveVsHazardByCondition:
    readonly ArchitectureV2AdaptiveHazardDiagnosticComparison[];
}

function normalizeToken(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(
      "_",
      "-",
    )
    .replaceAll(
      " ",
      "-",
    );
}

export function createArchitectureV2DiagnosticMatrixPlan():
  readonly ArchitectureV2DiagnosticPairRequest[] {
  const requests:
    ArchitectureV2DiagnosticPairRequest[] =
  [];

  for (
    const conditionId of
      ARCHITECTURE_V2_FORMAL_CONDITION_IDS
  ) {
    for (
      const replicationSeed of
        ARCHITECTURE_V2_DIAGNOSTIC_SEEDS
    ) {
      requests.push({
        populationLevel:
          ARCHITECTURE_V2_DIAGNOSTIC_POPULATION_LEVEL,

        conditionId,

        replicationSeed,

        pairKey:
          [
            "architecture-v2",
            "diagnostic",
            "medium",
            normalizeToken(
              conditionId,
            ),
            `seed-${replicationSeed}`,
          ].join(
            "__",
          ),
      });
    }
  }

  if (
    requests.length !==
    35
  ) {
    throw new Error(
      `Expected 35 diagnostic scenario pairs, found ${requests.length}.`,
    );
  }

  return Object.freeze(
    requests,
  );
}

function determineRunStatus(
  terminationReason:
    "ALL_RESOLVED"
    | "TIMEOUT"
    | null,

  unreachableAgents:
    number,
): ArchitectureV2DiagnosticRunStatus {
  if (
    terminationReason ===
    "TIMEOUT"
  ) {
    return "TIMEOUT";
  }

  if (
    unreachableAgents >
    0
  ) {
    return "UNREACHABLE_PRESENT";
  }

  return "COMPLETED";
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
      "Cannot calculate diagnostic mean from an empty collection.",
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

function meanNullable(
  values:
    readonly (
      number | null
    )[],
): number | null {
  const valid =
    values.filter(
      (
        value,
      ): value is number =>
        value !==
        null,
    );

  if (
    valid.length ===
    0
  ) {
    return null;
  }

  return mean(
    valid,
  );
}

function meanPairedNullableDifference(
  pairs:
    readonly {
      readonly adaptive:
        number | null;

      readonly hazard:
        number | null;
    }[],
): number | null {
  const differences =
    pairs.flatMap(
      (
        pair,
      ) =>
        pair.adaptive !==
          null &&
        pair.hazard !==
          null
          ? [
              pair.adaptive -
              pair.hazard,
            ]
          : [],
    );

  if (
    differences.length ===
    0
  ) {
    return null;
  }

  return mean(
    differences,
  );
}

function validateDiagnosticRecords(
  records:
    readonly ArchitectureV2DiagnosticRunRecord[],
): void {
  if (
    records.length !==
    175
  ) {
    throw new Error(
      `Architecture V2 diagnostic matrix requires exactly 125 runs, found ${records.length}.`,
    );
  }

  if (
    new Set(
      records.map(
        (
          record,
        ) =>
          record.runId,
      ),
    ).size !==
    175
  ) {
    throw new Error(
      "Architecture V2 diagnostic matrix contains duplicate run IDs.",
    );
  }

  const expectedSeeds =
    new Set<number>(
      ARCHITECTURE_V2_DIAGNOSTIC_SEEDS,
    );

  for (
    const record of
      records
  ) {
    if (
      record.populationLevel !==
      "MEDIUM"
    ) {
      throw new Error(
        "Architecture V2 diagnostic matrix must use MEDIUM occupancy only.",
      );
    }

    if (
      !expectedSeeds.has(
        record.replicationSeed,
      )
    ) {
      throw new Error(
        `Unexpected diagnostic seed: ${record.replicationSeed}.`,
      );
    }

    if (
      !ARCHITECTURE_V2_FORMAL_CONDITION_IDS
        .includes(
          record.conditionId,
        )
    ) {
      throw new Error(
        `Unexpected diagnostic condition: ${record.conditionId}.`,
      );
    }

    if (
      !ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
        .includes(
          record.strategyId,
        )
    ) {
      throw new Error(
        `Unexpected diagnostic strategy: ${record.strategyId}.`,
      );
    }
  }

  for (
    const conditionId of
      ARCHITECTURE_V2_FORMAL_CONDITION_IDS
  ) {
    for (
      const replicationSeed of
        ARCHITECTURE_V2_DIAGNOSTIC_SEEDS
    ) {
      const pairedRecords =
        records.filter(
          (
            record,
          ) =>
            record.conditionId ===
              conditionId &&
            record.replicationSeed ===
              replicationSeed,
        );

      if (
        pairedRecords.length !==
        5
      ) {
        throw new Error(
          `Diagnostic pair ${conditionId}/${replicationSeed} must contain five strategies.`,
        );
      }

      if (
        new Set(
          pairedRecords.map(
            (
              record,
            ) =>
              record.strategyId,
          ),
        ).size !==
        5
      ) {
        throw new Error(
          `Diagnostic pair ${conditionId}/${replicationSeed} does not contain five unique strategies.`,
        );
      }
    }
  }
}

function measuredOutcomeSignature(
  record:
    ArchitectureV2DiagnosticRunRecord,
): string {
  return JSON.stringify({
    runStatus:
      record.runStatus,

    terminationReason:
      record.terminationReason,

    totalEvacuationTimeSeconds:
      record.totalEvacuationTimeSeconds,

    meanEvacuationTimeSeconds:
      record.meanEvacuationTimeSeconds,

    p95EvacuationTimeSeconds:
      record.p95EvacuationTimeSeconds,

    populationHazardExposurePersonSeconds:
      record.populationHazardExposurePersonSeconds,

    maximumLocalDensityPersonsPerSquareMeter:
      record.maximumLocalDensityPersonsPerSquareMeter,

    populationQueueWaitPersonSeconds:
      record.populationQueueWaitPersonSeconds,

    meanQueueWaitSeconds:
      record.meanQueueWaitSeconds,

    maximumQueueWaitSeconds:
      record.maximumQueueWaitSeconds,

    completionRate:
      record.completionRate,

    unreachableAgents:
      record.unreachableAgents,

    timeoutAgents:
      record.timeoutAgents,

    meanTravelDistanceMeters:
      record.meanTravelDistanceMeters,

    totalReroutes:
      record.totalReroutes,

    totalAcceptedReroutes:
      record.totalAcceptedReroutes,

    totalExitTargetChanges:
      record.totalExitTargetChanges,

    totalRouteReversalEvents:
      record.totalRouteReversalEvents,

    exitUtilization:
      record.exitUtilization,
  });
}

function requireDiagnosticRecord(
  records:
    readonly ArchitectureV2DiagnosticRunRecord[],

  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,

  replicationSeed:
    number,

  strategyId:
    RoutingStrategyId,
): ArchitectureV2DiagnosticRunRecord {
  const found =
    records.find(
      (
        record,
      ) =>
        record.conditionId ===
          conditionId &&
        record.replicationSeed ===
          replicationSeed &&
        record.strategyId ===
          strategyId,
    );

  if (!found) {
    throw new Error(
      `Missing diagnostic record for ${conditionId}/${replicationSeed}/${strategyId}.`,
    );
  }

  return found;
}

export function createArchitectureV2DiagnosticSummary(
  records:
    readonly ArchitectureV2DiagnosticRunRecord[],

  provenance:
    Pick<
      ArchitectureV2FormalRepositoryProvenance,
      | "softwareVersion"
      | "gitCommit"
    >,
): ArchitectureV2DiagnosticSummary {
  validateDiagnosticRecords(
    records,
  );

  const strategyAggregates:
    ArchitectureV2DiagnosticStrategyAggregate[] =
  [];

  for (
    const conditionId of
      ARCHITECTURE_V2_FORMAL_CONDITION_IDS
  ) {
    for (
      const strategyId of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const sample =
        records.filter(
          (
            record,
          ) =>
            record.conditionId ===
              conditionId &&
            record.strategyId ===
              strategyId,
        );

      strategyAggregates.push({
        conditionId,

        strategyId,

        sampleCount:
          sample.length,

        completedCount:
          sample.filter(
            (
              record,
            ) =>
              record.runStatus ===
              "COMPLETED",
          ).length,

        meanTotalEvacuationTimeSeconds:
          meanNullable(
            sample.map(
              (
                record,
              ) =>
                record.totalEvacuationTimeSeconds,
            ),
          ),

        meanP95EvacuationTimeSeconds:
          meanNullable(
            sample.map(
              (
                record,
              ) =>
                record.p95EvacuationTimeSeconds,
            ),
          ),

        meanHazardExposurePersonSeconds:
          mean(
            sample.map(
              (
                record,
              ) =>
                record.populationHazardExposurePersonSeconds,
            ),
          ),

        meanQueueExposurePersonSeconds:
          mean(
            sample.map(
              (
                record,
              ) =>
                record.populationQueueWaitPersonSeconds,
            ),
          ),

        meanMaximumDensityPersonsPerSquareMeter:
          meanNullable(
            sample.map(
              (
                record,
              ) =>
                record.maximumLocalDensityPersonsPerSquareMeter,
            ),
          ),

        meanReroutes:
          mean(
            sample.map(
              (
                record,
              ) =>
                record.totalReroutes,
            ),
          ),

        meanExitTargetChanges:
          mean(
            sample.map(
              (
                record,
              ) =>
                record.totalExitTargetChanges,
            ),
          ),

        meanRouteReversalEvents:
          mean(
            sample.map(
              (
                record,
              ) =>
                record.totalRouteReversalEvents,
            ),
          ),
      });
    }
  }

  const adaptiveVsHazardByCondition:
    ArchitectureV2AdaptiveHazardDiagnosticComparison[] =
  [];

  for (
    const conditionId of
      ARCHITECTURE_V2_FORMAL_CONDITION_IDS
  ) {
    const pairs =
      ARCHITECTURE_V2_DIAGNOSTIC_SEEDS
        .map(
          (
            replicationSeed,
          ) => ({
            adaptive:
              requireDiagnosticRecord(
                records,
                conditionId,
                replicationSeed,
                "ADAPTIVE_HYBRID",
              ),

            hazard:
              requireDiagnosticRecord(
                records,
                conditionId,
                replicationSeed,
                "HAZARD_AWARE",
              ),
          }),
        );

    const identicalCount =
      pairs.filter(
        (
          pair,
        ) =>
          measuredOutcomeSignature(
            pair.adaptive,
          ) ===
          measuredOutcomeSignature(
            pair.hazard,
          ),
      ).length;

    adaptiveVsHazardByCondition.push({
      conditionId,

      replicationCount:
        pairs.length,

      identicalMeasuredOutcomeReplications:
        identicalCount,

      differingMeasuredOutcomeReplications:
        pairs.length -
        identicalCount,

      allMeasuredOutcomesIdentical:
        identicalCount ===
        pairs.length,

      meanAdaptiveMinusHazardTotalEvacuationTimeSeconds:
        meanPairedNullableDifference(
          pairs.map(
            (
              pair,
            ) => ({
              adaptive:
                pair.adaptive
                  .totalEvacuationTimeSeconds,

              hazard:
                pair.hazard
                  .totalEvacuationTimeSeconds,
            }),
          ),
        ),

      meanAdaptiveMinusHazardExposurePersonSeconds:
        mean(
          pairs.map(
            (
              pair,
            ) =>
              pair.adaptive
                .populationHazardExposurePersonSeconds -
              pair.hazard
                .populationHazardExposurePersonSeconds,
          ),
        ),

      meanAdaptiveMinusHazardQueueExposurePersonSeconds:
        mean(
          pairs.map(
            (
              pair,
            ) =>
              pair.adaptive
                .populationQueueWaitPersonSeconds -
              pair.hazard
                .populationQueueWaitPersonSeconds,
          ),
        ),

      meanAdaptiveMinusHazardReroutes:
        mean(
          pairs.map(
            (
              pair,
            ) =>
              pair.adaptive
                .totalReroutes -
              pair.hazard
                .totalReroutes,
          ),
        ),

      meanAdaptiveMinusHazardExitTargetChanges:
        mean(
          pairs.map(
            (
              pair,
            ) =>
              pair.adaptive
                .totalExitTargetChanges -
              pair.hazard
                .totalExitTargetChanges,
          ),
        ),

      meanAdaptiveMinusHazardRouteReversals:
        mean(
          pairs.map(
            (
              pair,
            ) =>
              pair.adaptive
                .totalRouteReversalEvents -
              pair.hazard
                .totalRouteReversalEvents,
          ),
        ),
    });
  }

  return {
    diagnosticVersion:
      ARCHITECTURE_V2_DIAGNOSTIC_MATRIX_VERSION,

    softwareVersion:
      provenance.softwareVersion,

    gitCommit:
      provenance.gitCommit,

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    speedAssignmentVersion:
      ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,

    populationLevel:
      ARCHITECTURE_V2_DIAGNOSTIC_POPULATION_LEVEL,

    replicationSeeds:
      [
        ...ARCHITECTURE_V2_DIAGNOSTIC_SEEDS,
      ],

    conditionIds:
      [
        ...ARCHITECTURE_V2_FORMAL_CONDITION_IDS,
      ],

    strategyIds:
      [
        ...ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
      ],

    totalPairs:
      35,

    totalRuns:
      records.length,

    completedRunCount:
      records.filter(
        (
          record,
        ) =>
          record.runStatus ===
          "COMPLETED",
      ).length,

    unreachablePresentRunCount:
      records.filter(
        (
          record,
        ) =>
          record.runStatus ===
          "UNREACHABLE_PRESENT",
      ).length,

    timeoutRunCount:
      records.filter(
        (
          record,
        ) =>
          record.runStatus ===
          "TIMEOUT",
      ).length,

    strategyAggregates,

    adaptiveVsHazardByCondition,
  };
}

function toCsvCell(
  value:
    | string
    | number
    | boolean
    | null,
): string {
  if (
    value ===
    null
  ) {
    return "";
  }

  const text =
    String(
      value,
    );

  if (
    text.includes(
      ",",
    ) ||
    text.includes(
      "\"",
    ) ||
    text.includes(
      "\n",
    ) ||
    text.includes(
      "\r",
    )
  ) {
    return `"${text.replace(
      /"/g,
      "\"\"",
    )}"`;
  }

  return text;
}

export function createArchitectureV2DiagnosticRunCsv(
  records:
    readonly ArchitectureV2DiagnosticRunRecord[],
): string {
  validateDiagnosticRecords(
    records,
  );

  const header = [
    "diagnosticVersion",
    "runId",
    "pairKey",
    "softwareVersion",
    "gitCommit",
    "parameterSetVersion",
    "speedAssignmentVersion",
    "scenarioId",
    "populationLevel",
    "population",
    "conditionId",
    "replicationSeed",
    "strategyId",
    "runStatus",
    "terminationReason",
    "appliedDisruptionCount",
    "totalEvacuationTimeSeconds",
    "meanEvacuationTimeSeconds",
    "p95EvacuationTimeSeconds",
    "populationHazardExposurePersonSeconds",
    "maximumLocalDensityPersonsPerSquareMeter",
    "populationQueueWaitPersonSeconds",
    "meanQueueWaitSeconds",
    "maximumQueueWaitSeconds",
    "completionRate",
    "unreachableAgents",
    "timeoutAgents",
    "meanTravelDistanceMeters",
    "totalReroutes",
    "totalAcceptedReroutes",
    "totalExitTargetChanges",
    "totalRouteReversalEvents",
    "exitUtilizationJson",
  ];

  const rows =
    records.map(
      (
        record,
      ) =>
        [
          record.diagnosticVersion,
          record.runId,
          record.pairKey,
          record.softwareVersion,
          record.gitCommit,
          record.parameterSetVersion,
          record.speedAssignmentVersion,
          record.scenarioId,
          record.populationLevel,
          record.population,
          record.conditionId,
          record.replicationSeed,
          record.strategyId,
          record.runStatus,
          record.terminationReason,
          record.appliedDisruptionCount,
          record.totalEvacuationTimeSeconds,
          record.meanEvacuationTimeSeconds,
          record.p95EvacuationTimeSeconds,
          record.populationHazardExposurePersonSeconds,
          record.maximumLocalDensityPersonsPerSquareMeter,
          record.populationQueueWaitPersonSeconds,
          record.meanQueueWaitSeconds,
          record.maximumQueueWaitSeconds,
          record.completionRate,
          record.unreachableAgents,
          record.timeoutAgents,
          record.meanTravelDistanceMeters,
          record.totalReroutes,
          record.totalAcceptedReroutes,
          record.totalExitTargetChanges,
          record.totalRouteReversalEvents,
          JSON.stringify(
            record.exitUtilization,
          ),
        ]
          .map(
            (
              value,
            ) =>
              toCsvCell(
                value,
              ),
          )
          .join(
            ",",
          ),
    );

  return [
    header.join(
      ",",
    ),
    ...rows,
  ].join(
    "\n",
  );
}

export function createArchitectureV2DiagnosticStrategySummaryCsv(
  summary:
    ArchitectureV2DiagnosticSummary,
): string {
  const header = [
    "conditionId",
    "strategyId",
    "sampleCount",
    "completedCount",
    "meanTotalEvacuationTimeSeconds",
    "meanP95EvacuationTimeSeconds",
    "meanHazardExposurePersonSeconds",
    "meanQueueExposurePersonSeconds",
    "meanMaximumDensityPersonsPerSquareMeter",
    "meanReroutes",
    "meanExitTargetChanges",
    "meanRouteReversalEvents",
  ];

  const rows =
    summary.strategyAggregates
      .map(
        (
          aggregate,
        ) =>
          [
            aggregate.conditionId,
            aggregate.strategyId,
            aggregate.sampleCount,
            aggregate.completedCount,
            aggregate.meanTotalEvacuationTimeSeconds,
            aggregate.meanP95EvacuationTimeSeconds,
            aggregate.meanHazardExposurePersonSeconds,
            aggregate.meanQueueExposurePersonSeconds,
            aggregate.meanMaximumDensityPersonsPerSquareMeter,
            aggregate.meanReroutes,
            aggregate.meanExitTargetChanges,
            aggregate.meanRouteReversalEvents,
          ]
            .map(
              (
                value,
              ) =>
                toCsvCell(
                  value,
                ),
            )
            .join(
              ",",
            ),
      );

  return [
    header.join(
      ",",
    ),
    ...rows,
  ].join(
    "\n",
  );
}

function executeArchitectureV2DiagnosticMatrix(
  provenance:
    ArchitectureV2FormalRepositoryProvenance,
): readonly ArchitectureV2DiagnosticRunRecord[] {
  const requests =
    createArchitectureV2DiagnosticMatrixPlan();

  const records:
    ArchitectureV2DiagnosticRunRecord[] =
  [];

  let completedPairs =
    0;

  for (
    const request of
      requests
  ) {
    /**
     * One stochastic scenario is created once and reused
     * for all five competing strategies.
     */
    const scenarioBundle =
      createArchitectureV2FormalScenario({
        populationLevel:
          request.populationLevel,

        conditionId:
          request.conditionId,

        replicationSeed:
          request.replicationSeed,
      });

    for (
      const strategyId of
        ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    ) {
      const simulation =
        runHeadlessSimulation({
          scenario:
            scenarioBundle.scenario,

          environment:
            scenarioBundle.environment,

          graph:
            scenarioBundle.graph,

          exits:
            scenarioBundle.exits,

          spawnZones:
            scenarioBundle.spawnZones,

          configuration: {
            strategyId,

            timestepSeconds:
              ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

            maximumSimulationTimeSeconds:
              ARCHITECTURE_V2_FORMAL_MAXIMUM_SIMULATION_TIME_SECONDS,

            densityCellLengthMeters:
              ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

            specificFlowPersonsPerMeterSecond:
              ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

            adaptiveRerouteThreshold:
              ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
          },
        });

      records.push({
        diagnosticVersion:
          ARCHITECTURE_V2_DIAGNOSTIC_MATRIX_VERSION,

        runId:
          [
            request.pairKey,
            normalizeToken(
              strategyId,
            ),
          ].join(
            "__",
          ),

        pairKey:
          request.pairKey,

        softwareVersion:
          provenance.softwareVersion,

        gitCommit:
          provenance.gitCommit,

        parameterSetVersion:
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

        speedAssignmentVersion:
          ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,

        scenarioId:
          simulation.scenarioId,

        populationLevel:
          "MEDIUM",

        population:
          simulation.metrics
            .totalAgents,

        conditionId:
          request.conditionId,

        replicationSeed:
          request.replicationSeed,

        strategyId,

        runStatus:
          determineRunStatus(
            simulation.termination
              .reason,
            simulation.metrics
              .unreachableAgents,
          ),

        terminationReason:
          simulation.termination
            .reason,

        appliedDisruptionCount:
          simulation.appliedDisruptions
            .length,

        totalEvacuationTimeSeconds:
          simulation.metrics
            .totalEvacuationTimeSeconds,

        meanEvacuationTimeSeconds:
          simulation.metrics
            .meanEvacuationTimeSeconds,

        p95EvacuationTimeSeconds:
          simulation.metrics
            .p95EvacuationTimeSeconds,

        populationHazardExposurePersonSeconds:
          simulation.metrics
            .populationHazardExposurePersonSeconds,

        maximumLocalDensityPersonsPerSquareMeter:
          simulation.metrics
            .maximumLocalDensityPersonsPerSquareMeter,

        populationQueueWaitPersonSeconds:
          simulation.queueMetrics
            .populationQueueWaitPersonSeconds,

        meanQueueWaitSeconds:
          simulation.queueMetrics
            .meanQueueWaitSeconds,

        maximumQueueWaitSeconds:
          simulation.queueMetrics
            .maximumQueueWaitSeconds,

        completionRate:
          simulation.metrics
            .completionRate,

        unreachableAgents:
          simulation.metrics
            .unreachableAgents,

        timeoutAgents:
          simulation.metrics
            .timeoutAgents,

        meanTravelDistanceMeters:
          simulation.metrics
            .meanTravelDistanceMeters,

        totalReroutes:
          simulation.metrics
            .totalReroutes,

        totalAcceptedReroutes:
          simulation.routeStability
            .totalAcceptedReroutes,

        totalExitTargetChanges:
          simulation.routeStability
            .totalExitTargetChanges,

        totalRouteReversalEvents:
          simulation.routeStability
            .totalRouteReversalEvents,

        exitUtilization:
          simulation.metrics
            .exitUtilization,
      });
    }

    completedPairs +=
      1;

    console.log(
      `Progress: ${completedPairs}/35 pairs, ${records.length}/175 runs`,
    );
  }

  validateDiagnosticRecords(
    records,
  );

  return records;
}

function prepareOutputPaths(
  outputDirectory:
    string,
) {
  const resolvedOutputDirectory =
    resolve(
      outputDirectory,
    );

  const runCsvPath =
    join(
      resolvedOutputDirectory,
      ARCHITECTURE_V2_DIAGNOSTIC_RUN_RECORDS_FILENAME,
    );

  const strategySummaryCsvPath =
    join(
      resolvedOutputDirectory,
      ARCHITECTURE_V2_DIAGNOSTIC_STRATEGY_SUMMARY_FILENAME,
    );

  const summaryJsonPath =
    join(
      resolvedOutputDirectory,
      ARCHITECTURE_V2_DIAGNOSTIC_SUMMARY_FILENAME,
    );

  for (
    const path of
      [
        runCsvPath,
        strategySummaryCsvPath,
        summaryJsonPath,
      ]
  ) {
    if (
      existsSync(
        path,
      )
    ) {
      throw new Error(
        `Diagnostic output already exists: ${path}. Refusing to overwrite.`,
      );
    }
  }

  return {
    resolvedOutputDirectory,
    runCsvPath,
    strategySummaryCsvPath,
    summaryJsonPath,
  };
}

export function parseArchitectureV2DiagnosticArguments(
  argumentsList:
    readonly string[],
): {
  readonly outputDirectory:
    string;
} {
  if (
    argumentsList.length !==
      2 ||
    argumentsList[0] !==
      "--output" ||
    !argumentsList[1]?.trim()
  ) {
    throw new Error(
      "Usage: npm run diagnostic:matrix -- --output <directory>",
    );
  }

  return {
    outputDirectory:
      resolve(
        argumentsList[1],
      ),
  };
}

function main():
  void {
  const parsed =
    parseArchitectureV2DiagnosticArguments(
      process.argv.slice(
        2,
      ),
    );

  /**
   * Verify output collision before spending time on the
   * 175 simulations.
   */
  const outputPaths =
    prepareOutputPaths(
      parsed.outputDirectory,
    );

  /**
   * Diagnostic execution also requires committed source.
   */
  const provenance =
    createArchitectureV2FormalRepositoryProvenance();

  console.log(
    "Architecture V2 diagnostic matrix",
  );

  console.log(
    `Software version: ${provenance.softwareVersion}`,
  );

  console.log(
    `Git commit: ${provenance.gitCommit}`,
  );

  console.log(
    "Population: MEDIUM",
  );

  console.log(
    `Diagnostic seeds: ${ARCHITECTURE_V2_DIAGNOSTIC_SEEDS.join(", ")}`,
  );

  console.log(
    "Planned execution: 25 paired scenarios / 175 simulations",
  );

  const records =
    executeArchitectureV2DiagnosticMatrix(
      provenance,
    );

  const summary =
    createArchitectureV2DiagnosticSummary(
      records,
      provenance,
    );

  const runCsv =
    `${createArchitectureV2DiagnosticRunCsv(
      records,
    )}\n`;

  const strategySummaryCsv =
    `${createArchitectureV2DiagnosticStrategySummaryCsv(
      summary,
    )}\n`;

  const summaryJson =
    `${JSON.stringify(
      summary,
      null,
      2,
    )}\n`;

  mkdirSync(
    outputPaths
      .resolvedOutputDirectory,
    {
      recursive:
        true,
    },
  );

  writeFileSync(
    outputPaths.runCsvPath,
    runCsv,
    {
      encoding:
        "utf8",

      flag:
        "wx",
    },
  );

  writeFileSync(
    outputPaths
      .strategySummaryCsvPath,
    strategySummaryCsv,
    {
      encoding:
        "utf8",

      flag:
        "wx",
    },
  );

  writeFileSync(
    outputPaths.summaryJsonPath,
    summaryJson,
    {
      encoding:
        "utf8",

      flag:
        "wx",
    },
  );

  console.log(
    "Diagnostic matrix complete.",
  );

  console.log(
    `Completed: ${summary.completedRunCount}`,
  );

  console.log(
    `Unreachable-present: ${summary.unreachablePresentRunCount}`,
  );

  console.log(
    `Timeout: ${summary.timeoutRunCount}`,
  );

  console.log(
    `Run records: ${outputPaths.runCsvPath}`,
  );

  console.log(
    `Strategy summary: ${outputPaths.strategySummaryCsvPath}`,
  );

  console.log(
    `Diagnostic summary: ${outputPaths.summaryJsonPath}`,
  );

  console.log(
    "Adaptive Hybrid vs Hazard-Aware:",
  );

  for (
    const comparison of
      summary.adaptiveVsHazardByCondition
  ) {
    console.log(
      `${comparison.conditionId}: identical=${comparison.identicalMeasuredOutcomeReplications}/${comparison.replicationCount}, different=${comparison.differingMeasuredOutcomeReplications}/${comparison.replicationCount}`,
    );
  }
}

const executedFile =
  process.argv[1];

if (
  executedFile &&
  import.meta.url ===
    pathToFileURL(
      executedFile,
    ).href
) {
  try {
    main();
  } catch (
    error
  ) {
    console.error(
      error instanceof Error
        ? error.message
        : String(
            error,
          ),
    );

    process.exitCode =
      1;
  }
}