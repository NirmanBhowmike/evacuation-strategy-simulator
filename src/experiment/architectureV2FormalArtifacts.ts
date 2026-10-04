import {
  ARCHITECTURE_V2_FORMAL_CONDITION_IDS,
  ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "./architectureV2FormalExperimentDesign";

import type {
  ArchitectureV2FormalExecutionScope,
  ArchitectureV2FormalExecutionSummary,
} from "./architectureV2FormalExperimentExecutor";

import {
  ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION,
  createArchitectureV2FormalOutputRecords,
} from "./architectureV2FormalOutput";

import type {
  ArchitectureV2FormalOutputRecord,
  ArchitectureV2FormalSoftwareProvenance,
} from "./architectureV2FormalOutput";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

/**
 * Version identifier for the collection of formal
 * machine-readable artifact files.
 */
export const ARCHITECTURE_V2_FORMAL_ARTIFACT_SET_VERSION =
  "architecture-v2-formal-artifacts-v1";

export const ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME =
  "formal-run-records.json";

export const ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME =
  "formal-run-records.csv";

export const ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME =
  "formal-experiment-manifest.json";

export interface ArchitectureV2FormalArtifactManifest {
  readonly artifactSetVersion:
    string;

  readonly outputSchemaVersion:
    string;

  readonly executionScope:
    ArchitectureV2FormalExecutionScope;

  readonly softwareVersion:
    string;

  readonly gitCommit:
    string;

  readonly designVersion:
    string;

  readonly seedBankVersion:
    string;

  readonly parameterSetVersion:
    string;

  readonly totalRuns:
    number;

  readonly completedRuns:
    number;

  readonly recordCount:
    number;

  readonly uniquePairCount:
    number;

  readonly uniqueScenarioCount:
    number;

  readonly uniqueCellCount:
    number;

  readonly completedRunCount:
    number;

  readonly unreachablePresentRunCount:
    number;

  readonly timeoutRunCount:
    number;

  readonly populationLevels:
    readonly ArchitectureV2FormalPopulationLevel[];

  readonly conditionIds:
    readonly ArchitectureV2ResearchDisruptionConditionId[];

  readonly strategyIds:
    readonly RoutingStrategyId[];

  readonly replicationSeeds:
    readonly number[];

  readonly files: {
    readonly recordsJson:
      string;

    readonly recordsCsv:
      string;

    readonly manifestJson:
      string;
  };
}

export interface ArchitectureV2FormalArtifacts {
  readonly manifest:
    ArchitectureV2FormalArtifactManifest;

  readonly records:
    readonly ArchitectureV2FormalOutputRecord[];

  readonly recordsJson:
    string;

  readonly recordsCsv:
    string;

  readonly manifestJson:
    string;
}

function toCsvCell(
  value:
    | string
    | number
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

function createFormalRecordsCsv(
  records:
    readonly ArchitectureV2FormalOutputRecord[],
): string {
  const headers = [
    "outputSchemaVersion",
    "runId",
    "pairKey",
    "cellId",
    "designVersion",
    "seedBankVersion",
    "parameterSetVersion",
    "softwareVersion",
    "gitCommit",
    "scenarioId",
    "replicationSeed",
    "populationLevel",
    "population",
    "conditionId",
    "strategyId",
    "runStatus",
    "terminationReason",
    "simulatedTimeSeconds",
    "ticks",
    "appliedDisruptionCount",
    "totalEvacuationTimeSeconds",
    "meanEvacuationTimeSeconds",
    "p95EvacuationTimeSeconds",
    "populationHazardExposurePersonSeconds",
    "meanHazardExposureSeconds",
    "maximumLocalDensityPersonsPerSquareMeter",
    "populationQueueWaitPersonSeconds",
    "meanQueueWaitSeconds",
    "maximumQueueWaitSeconds",
    "completionRate",
    "evacuatedAgents",
    "unreachableAgents",
    "timeoutAgents",
    "meanTravelDistanceMeters",
    "totalReroutes",
    "meanReroutesPerAgent",
    "fractionRerouted",
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
          record.outputSchemaVersion,
          record.runId,
          record.pairKey,
          record.cellId,
          record.designVersion,
          record.seedBankVersion,
          record.parameterSetVersion,
          record.softwareVersion,
          record.gitCommit,
          record.scenarioId,
          record.replicationSeed,
          record.populationLevel,
          record.population,
          record.conditionId,
          record.strategyId,
          record.runStatus,
          record.terminationReason,
          record.simulatedTimeSeconds,
          record.ticks,
          record.appliedDisruptionCount,
          record.totalEvacuationTimeSeconds,
          record.meanEvacuationTimeSeconds,
          record.p95EvacuationTimeSeconds,
          record.populationHazardExposurePersonSeconds,
          record.meanHazardExposureSeconds,
          record.maximumLocalDensityPersonsPerSquareMeter,
          record.populationQueueWaitPersonSeconds,
          record.meanQueueWaitSeconds,
          record.maximumQueueWaitSeconds,
          record.completionRate,
          record.evacuatedAgents,
          record.unreachableAgents,
          record.timeoutAgents,
          record.meanTravelDistanceMeters,
          record.totalReroutes,
          record.meanReroutesPerAgent,
          record.fractionRerouted,
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
    headers.join(
      ",",
    ),
    ...rows,
  ].join(
    "\n",
  );
}

function requireSingleValue(
  values:
    readonly string[],

  label:
    string,
): string {
  const unique =
    new Set(
      values,
    );

  if (
    unique.size !==
    1
  ) {
    throw new Error(
      `Architecture V2 formal artifacts require one consistent ${label}.`,
    );
  }

  const value =
    values[0];

  if (!value) {
    throw new Error(
      `Architecture V2 formal artifacts could not determine ${label}.`,
    );
  }

  return value;
}

function orderedObservedPopulationLevels(
  records:
    readonly ArchitectureV2FormalOutputRecord[],
): readonly ArchitectureV2FormalPopulationLevel[] {
  const observed =
    new Set(
      records.map(
        (
          record,
        ) =>
          record.populationLevel,
      ),
    );

  return ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS
    .filter(
      (
        level,
      ) =>
        observed.has(
          level,
        ),
    );
}

function orderedObservedConditionIds(
  records:
    readonly ArchitectureV2FormalOutputRecord[],
): readonly ArchitectureV2ResearchDisruptionConditionId[] {
  const observed =
    new Set(
      records.map(
        (
          record,
        ) =>
          record.conditionId,
      ),
    );

  return ARCHITECTURE_V2_FORMAL_CONDITION_IDS
    .filter(
      (
        conditionId,
      ) =>
        observed.has(
          conditionId,
        ),
    );
}

function orderedObservedStrategyIds(
  records:
    readonly ArchitectureV2FormalOutputRecord[],
): readonly RoutingStrategyId[] {
  const observed =
    new Set(
      records.map(
        (
          record,
        ) =>
          record.strategyId,
      ),
    );

  return ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    .filter(
      (
        strategyId,
      ) =>
        observed.has(
          strategyId,
        ),
    );
}

function sortedReplicationSeeds(
  records:
    readonly ArchitectureV2FormalOutputRecord[],
): readonly number[] {
  return [
    ...new Set(
      records.map(
        (
          record,
        ) =>
          record.replicationSeed,
      ),
    ),
  ].sort(
    (
      first,
      second,
    ) =>
      first -
      second,
  );
}

function validateExecutionSummary(
  summary:
    ArchitectureV2FormalExecutionSummary,
): void {
  if (
    summary.results.length ===
    0
  ) {
    throw new Error(
      "Architecture V2 formal artifacts require at least one completed execution result.",
    );
  }

  if (
    summary.totalRuns !==
    summary.results.length
  ) {
    throw new Error(
      "Architecture V2 formal execution summary totalRuns does not match its result count.",
    );
  }

  if (
    summary.completedRuns !==
    summary.results.length
  ) {
    throw new Error(
      "Architecture V2 formal execution summary is incomplete and cannot yet be serialized as a completed artifact set.",
    );
  }

  const classifiedRuns =
    summary.completedRunCount +
    summary.unreachablePresentRunCount +
    summary.timeoutRunCount;

  if (
    classifiedRuns !==
    summary.results.length
  ) {
    throw new Error(
      "Architecture V2 formal execution status counts do not match the result count.",
    );
  }
}

/**
 * Creates the complete machine-readable formal artifact
 * set without writing to the file system.
 *
 * The caller is responsible for writing:
 *
 * - formal-run-records.json
 * - formal-run-records.csv
 * - formal-experiment-manifest.json
 */
export function createArchitectureV2FormalArtifacts(
  summary:
    ArchitectureV2FormalExecutionSummary,

  provenance:
    ArchitectureV2FormalSoftwareProvenance,
): ArchitectureV2FormalArtifacts {
  validateExecutionSummary(
    summary,
  );

  const records =
    createArchitectureV2FormalOutputRecords(
      summary.results,
      provenance,
    );

  const runIds =
    records.map(
      (
        record,
      ) =>
        record.runId,
    );

  if (
    new Set(
      runIds,
    ).size !==
    runIds.length
  ) {
    throw new Error(
      "Architecture V2 formal artifact records contain duplicate run identifiers.",
    );
  }

  const designVersion =
    requireSingleValue(
      records.map(
        (
          record,
        ) =>
          record.designVersion,
      ),
      "design version",
    );

  const seedBankVersion =
    requireSingleValue(
      records.map(
        (
          record,
        ) =>
          record.seedBankVersion,
      ),
      "seed-bank version",
    );

  const parameterSetVersion =
    requireSingleValue(
      records.map(
        (
          record,
        ) =>
          record.parameterSetVersion,
      ),
      "parameter-set version",
    );

  const softwareVersion =
    requireSingleValue(
      records.map(
        (
          record,
        ) =>
          record.softwareVersion,
      ),
      "software version",
    );

  const gitCommit =
    requireSingleValue(
      records.map(
        (
          record,
        ) =>
          record.gitCommit,
      ),
      "Git commit",
    );

  const manifest:
    ArchitectureV2FormalArtifactManifest = {
    artifactSetVersion:
      ARCHITECTURE_V2_FORMAL_ARTIFACT_SET_VERSION,

    outputSchemaVersion:
      ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION,

    executionScope:
      summary.scope,

    softwareVersion,

    gitCommit,

    designVersion,

    seedBankVersion,

    parameterSetVersion,

    totalRuns:
      summary.totalRuns,

    completedRuns:
      summary.completedRuns,

    recordCount:
      records.length,

    uniquePairCount:
      new Set(
        records.map(
          (
            record,
          ) =>
            record.pairKey,
        ),
      ).size,

    uniqueScenarioCount:
      new Set(
        records.map(
          (
            record,
          ) =>
            record.scenarioId,
        ),
      ).size,

    uniqueCellCount:
      new Set(
        records.map(
          (
            record,
          ) =>
            record.cellId,
        ),
      ).size,

    completedRunCount:
      summary.completedRunCount,

    unreachablePresentRunCount:
      summary.unreachablePresentRunCount,

    timeoutRunCount:
      summary.timeoutRunCount,

    populationLevels:
      orderedObservedPopulationLevels(
        records,
      ),

    conditionIds:
      orderedObservedConditionIds(
        records,
      ),

    strategyIds:
      orderedObservedStrategyIds(
        records,
      ),

    replicationSeeds:
      sortedReplicationSeeds(
        records,
      ),

    files: {
      recordsJson:
        ARCHITECTURE_V2_FORMAL_RECORDS_JSON_FILENAME,

      recordsCsv:
        ARCHITECTURE_V2_FORMAL_RECORDS_CSV_FILENAME,

      manifestJson:
        ARCHITECTURE_V2_FORMAL_MANIFEST_JSON_FILENAME,
    },
  };

  const recordsJson =
    `${JSON.stringify(
      records,
      null,
      2,
    )}\n`;

  const recordsCsv =
    `${createFormalRecordsCsv(
      records,
    )}\n`;

  const manifestJson =
    `${JSON.stringify(
      manifest,
      null,
      2,
    )}\n`;

  return {
    manifest,

    records,

    recordsJson,

    recordsCsv,

    manifestJson,
  };
}