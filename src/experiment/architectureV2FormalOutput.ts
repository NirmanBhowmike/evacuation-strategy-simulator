import type {
  ArchitectureV2FormalRunResult,
  ArchitectureV2FormalRunStatus,
} from "./architectureV2FormalExperimentRunner";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  ExitUtilizationMetric,
} from "../types/metrics";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

/**
 * Version identifier for the formal Architecture V2
 * machine-readable output schema.
 *
 * Any structural change to exported formal result records
 * after research execution begins must receive a new
 * schema version.
 */
export const ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION =
  "architecture-v2-formal-output-v1";

/**
 * Software provenance must identify the exact application
 * version and Git revision used for formal execution.
 *
 * The future command-line launcher will populate these
 * values automatically.
 */
export interface ArchitectureV2FormalSoftwareProvenance {
  readonly softwareVersion:
    string;

  readonly gitCommit:
    string;
}

/**
 * One normalized formal research-result record.
 *
 * One record corresponds to exactly one:
 *
 * strategy
 * × occupancy
 * × disruption condition
 * × replication seed
 *
 * simulation execution.
 */
export interface ArchitectureV2FormalOutputRecord {
  readonly outputSchemaVersion:
    string;

  readonly runId:
    string;

  readonly pairKey:
    string;

  readonly cellId:
    string;

  readonly designVersion:
    string;

  readonly seedBankVersion:
    string;

  readonly parameterSetVersion:
    string;

  readonly softwareVersion:
    string;

  readonly gitCommit:
    string;

  readonly scenarioId:
    string;

  readonly replicationSeed:
    number;

  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly population:
    number;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly strategyId:
    RoutingStrategyId;

  readonly runStatus:
    ArchitectureV2FormalRunStatus;

  readonly terminationReason:
    "ALL_RESOLVED"
    | "TIMEOUT"
    | null;

  readonly simulatedTimeSeconds:
    number;

  readonly ticks:
    number;

  readonly appliedDisruptionCount:
    number;

  /**
   * Co-primary performance outcome.
   *
   * Null when complete evacuation does not occur.
   */
  readonly totalEvacuationTimeSeconds:
    number | null;

  readonly meanEvacuationTimeSeconds:
    number | null;

  readonly p95EvacuationTimeSeconds:
    number | null;

  /**
   * Co-primary safety outcome.
   *
   * Units:
   * person-seconds.
   */
  readonly populationHazardExposurePersonSeconds:
    number;

  readonly meanHazardExposureSeconds:
    number;

  readonly maximumLocalDensityPersonsPerSquareMeter:
    number | null;

  /**
   * Population-level queue exposure.
   *
   * Units:
   * person-seconds.
   */
  readonly populationQueueWaitPersonSeconds:
    number;

  readonly meanQueueWaitSeconds:
    number;

  readonly maximumQueueWaitSeconds:
    number;

  readonly completionRate:
    number;

  readonly evacuatedAgents:
    number;

  readonly unreachableAgents:
    number;

  readonly timeoutAgents:
    number;

  readonly meanTravelDistanceMeters:
    number;

  readonly totalReroutes:
    number;

  readonly meanReroutesPerAgent:
    number;

  readonly fractionRerouted:
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

function requireNonEmpty(
  value:
    string,

  label:
    string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${label} must be non-empty.`,
    );
  }

  return normalized;
}

function validateSoftwareProvenance(
  provenance:
    ArchitectureV2FormalSoftwareProvenance,
): ArchitectureV2FormalSoftwareProvenance {
  return {
    softwareVersion:
      requireNonEmpty(
        provenance.softwareVersion,
        "Formal experiment software version",
      ),

    gitCommit:
      requireNonEmpty(
        provenance.gitCommit,
        "Formal experiment Git commit",
      ),
  };
}

/**
 * Converts one authoritative formal simulation result into
 * the normalized research-output schema.
 *
 * No research metric is recomputed here. Values are copied
 * from the already validated formal run result.
 */
export function createArchitectureV2FormalOutputRecord(
  result:
    ArchitectureV2FormalRunResult,

  provenance:
    ArchitectureV2FormalSoftwareProvenance,
): ArchitectureV2FormalOutputRecord {
  const validatedProvenance =
    validateSoftwareProvenance(
      provenance,
    );

  return {
    outputSchemaVersion:
      ARCHITECTURE_V2_FORMAL_OUTPUT_SCHEMA_VERSION,

    runId:
      result.runId,

    pairKey:
      result.pairKey,

    cellId:
      result.cellId,

    designVersion:
      result.designVersion,

    seedBankVersion:
      result.seedBankVersion,

    parameterSetVersion:
      result.parameterSetVersion,

    softwareVersion:
      validatedProvenance
        .softwareVersion,

    gitCommit:
      validatedProvenance
        .gitCommit,

    scenarioId:
      result.scenarioId,

    replicationSeed:
      result.replicationSeed,

    populationLevel:
      result.populationLevel,

    population:
      result.population,

    conditionId:
      result.conditionId,

    strategyId:
      result.strategyId,

    runStatus:
      result.runStatus,

    terminationReason:
      result.terminationReason,

    simulatedTimeSeconds:
      result.simulatedTimeSeconds,

    ticks:
      result.ticks,

    appliedDisruptionCount:
      result.appliedDisruptionCount,

    totalEvacuationTimeSeconds:
      result.metrics
        .totalEvacuationTimeSeconds,

    meanEvacuationTimeSeconds:
      result.metrics
        .meanEvacuationTimeSeconds,

    p95EvacuationTimeSeconds:
      result.metrics
        .p95EvacuationTimeSeconds,

    populationHazardExposurePersonSeconds:
      result.metrics
        .populationHazardExposurePersonSeconds,

    meanHazardExposureSeconds:
      result.metrics
        .meanHazardExposureSeconds,

    maximumLocalDensityPersonsPerSquareMeter:
      result.metrics
        .maximumLocalDensityPersonsPerSquareMeter,

    populationQueueWaitPersonSeconds:
      result.metrics
        .populationQueueWaitPersonSeconds,

    meanQueueWaitSeconds:
      result.metrics
        .meanQueueWaitSeconds,

    maximumQueueWaitSeconds:
      result.metrics
        .maximumQueueWaitSeconds,

    completionRate:
      result.metrics
        .completionRate,

    evacuatedAgents:
      result.metrics
        .evacuatedAgents,

    unreachableAgents:
      result.metrics
        .unreachableAgents,

    timeoutAgents:
      result.metrics
        .timeoutAgents,

    meanTravelDistanceMeters:
      result.metrics
        .meanTravelDistanceMeters,

    totalReroutes:
      result.metrics
        .totalReroutes,

    meanReroutesPerAgent:
      result.metrics
        .meanReroutesPerAgent,

    fractionRerouted:
      result.metrics
        .fractionRerouted,

    totalAcceptedReroutes:
      result.metrics
        .totalAcceptedReroutes,

    totalExitTargetChanges:
      result.metrics
        .totalExitTargetChanges,

    totalRouteReversalEvents:
      result.metrics
        .totalRouteReversalEvents,

    exitUtilization:
      result.metrics
        .exitUtilization,
  };
}

/**
 * Converts a complete execution result collection into the
 * normalized formal-output schema while preserving original
 * run ordering.
 */
export function createArchitectureV2FormalOutputRecords(
  results:
    readonly ArchitectureV2FormalRunResult[],

  provenance:
    ArchitectureV2FormalSoftwareProvenance,
): readonly ArchitectureV2FormalOutputRecord[] {
  if (
    results.length ===
    0
  ) {
    throw new Error(
      "Architecture V2 formal output requires at least one simulation result.",
    );
  }

  const runIds =
    results.map(
      (
        result,
      ) =>
        result.runId,
    );

  if (
    new Set(
      runIds,
    ).size !==
    runIds.length
  ) {
    throw new Error(
      "Architecture V2 formal output contains duplicate run identifiers.",
    );
  }

  const validatedProvenance =
    validateSoftwareProvenance(
      provenance,
    );

  return results.map(
    (
      result,
    ) =>
      createArchitectureV2FormalOutputRecord(
        result,
        validatedProvenance,
      ),
  );
}