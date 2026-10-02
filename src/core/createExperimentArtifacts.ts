import type {
  BatchExperimentConfiguration,
  BatchExperimentResult,
  BatchExperimentRun,
} from "../types/batchExperiment";
import type {
  ExperimentArtifactConfiguration,
  ExperimentArtifacts,
  ExperimentRegistryRecord,
  ExperimentRunStatus,
  ScenarioExperimentMetadata,
  StrategyMetricAggregate,
} from "../types/experimentArtifacts";
import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

const DEFAULT_ADAPTIVE_THRESHOLD =
  0.20;

function validateNonEmpty(
  value: string,
  label: string,
): void {
  if (!value.trim()) {
    throw new Error(
      `${label} must be non-empty.`,
    );
  }
}

function validateArtifactConfiguration(
  batchConfiguration:
    BatchExperimentConfiguration,
  batchResult:
    BatchExperimentResult,
  artifactConfiguration:
    ExperimentArtifactConfiguration,
): void {
  if (
    batchConfiguration.batchId !==
    batchResult.batchId
  ) {
    throw new Error(
      "Batch configuration and result must use the same batch id.",
    );
  }

  validateNonEmpty(
    artifactConfiguration
      .researchQuestion,
    "Research question",
  );

  validateNonEmpty(
    artifactConfiguration
      .software
      .softwareVersion,
    "Software version",
  );

  validateNonEmpty(
    artifactConfiguration
      .software
      .gitCommit,
    "Git commit",
  );

  validateNonEmpty(
    artifactConfiguration
      .outputDirectory,
    "Output directory",
  );

  const scenarioMetadataIds =
    new Set<string>();

  for (
    const metadata of
      artifactConfiguration
        .scenarioMetadata
  ) {
    validateNonEmpty(
      metadata.scenarioId,
      "Scenario metadata id",
    );

    validateNonEmpty(
      metadata
        .scenarioFamily,
      `Scenario family for ${metadata.scenarioId}`,
    );

    validateNonEmpty(
      metadata
        .occupancyCondition,
      `Occupancy condition for ${metadata.scenarioId}`,
    );

    validateNonEmpty(
      metadata
        .disruptionCondition,
      `Disruption condition for ${metadata.scenarioId}`,
    );

    if (
      scenarioMetadataIds.has(
        metadata.scenarioId,
      )
    ) {
      throw new Error(
        `Duplicate scenario metadata id: ${metadata.scenarioId}`,
      );
    }

    scenarioMetadataIds.add(
      metadata.scenarioId,
    );
  }

  for (
    const scenarioId of
      batchResult.scenarioIds
  ) {
    if (
      !scenarioMetadataIds.has(
        scenarioId,
      )
    ) {
      throw new Error(
        `Missing experiment metadata for scenario: ${scenarioId}`,
      );
    }
  }

  const timing =
    artifactConfiguration
      .computationTimeMillisecondsByRunId ??
    {};

  const knownRunIds =
    new Set(
      batchResult.runs.map(
        (run) => run.runId,
      ),
    );

  for (
    const [
      runId,
      milliseconds,
    ] of Object.entries(
      timing,
    )
  ) {
    if (
      !knownRunIds.has(
        runId,
      )
    ) {
      throw new Error(
        `Computation-time metadata references unknown run: ${runId}`,
      );
    }

    if (
      !Number.isFinite(
        milliseconds,
      ) ||
      milliseconds < 0
    ) {
      throw new Error(
        `Computation time for ${runId} must be non-negative and finite.`,
      );
    }
  }
}

function getScenarioMetadata(
  scenarioId: string,
  metadata:
    readonly ScenarioExperimentMetadata[],
): ScenarioExperimentMetadata {
  const found =
    metadata.find(
      (candidate) =>
        candidate.scenarioId ===
        scenarioId,
    );

  if (!found) {
    throw new Error(
      `Missing experiment metadata for scenario: ${scenarioId}`,
    );
  }

  return found;
}

function determineRunStatus(
  run:
    BatchExperimentRun,
): ExperimentRunStatus {
  if (
    run.result.termination
      .reason ===
    "TIMEOUT"
  ) {
    return "TIMEOUT";
  }

  if (
    run.result.metrics
      .unreachableAgents >
    0
  ) {
    return "UNREACHABLE_PRESENT";
  }

  return "COMPLETED";
}

function getAdaptiveThreshold(
  strategyId:
    RoutingStrategyId,
  batchConfiguration:
    BatchExperimentConfiguration,
): number | null {
  if (
    strategyId !==
    "ADAPTIVE_HYBRID"
  ) {
    return null;
  }

  return (
    batchConfiguration
      .simulationConfiguration
      ?.adaptiveRerouteThreshold ??
    DEFAULT_ADAPTIVE_THRESHOLD
  );
}

function createExperimentId(
  batchId: string,
  runId: string,
): string {
  return `${batchId}__${runId}`;
}

function createRegistryRecord(
  run:
    BatchExperimentRun,
  batchConfiguration:
    BatchExperimentConfiguration,
  artifactConfiguration:
    ExperimentArtifactConfiguration,
): ExperimentRegistryRecord {
  const metadata =
    getScenarioMetadata(
      run.scenarioId,
      artifactConfiguration
        .scenarioMetadata,
    );

  const computationTimeMilliseconds =
    artifactConfiguration
      .computationTimeMillisecondsByRunId?.[
      run.runId
    ] ??
    null;

  return Object.freeze({
    experimentId:
      createExperimentId(
        batchConfiguration.batchId,
        run.runId,
      ),

    batchId:
      batchConfiguration.batchId,

    runId:
      run.runId,

    experimentType:
      artifactConfiguration
        .experimentType,

    researchQuestion:
      artifactConfiguration
        .researchQuestion,

    scenarioInstanceId:
      run.scenarioId,

    seed:
      run.seed,

    layoutId:
      run.result.layoutId,

    scenarioFamily:
      metadata.scenarioFamily,

    occupancyCondition:
      metadata
        .occupancyCondition,

    disruptionCondition:
      metadata
        .disruptionCondition,

    strategy:
      run.strategyId,

    softwareVersion:
      artifactConfiguration
        .software
        .softwareVersion,

    softwareCommit:
      artifactConfiguration
        .software
        .gitCommit,

    parameterSetVersion:
      run.parameterSetId,

    adaptiveThreshold:
      getAdaptiveThreshold(
        run.strategyId,
        batchConfiguration,
      ),

    totalEvacuationTime:
      run.result.metrics
        .totalEvacuationTimeSeconds,

    p95EvacuationTime:
      run.result.metrics
        .p95EvacuationTimeSeconds,

    hazardExposure:
      run.result.metrics
        .populationHazardExposurePersonSeconds,

    maximumDensity:
      run.result.metrics
        .maximumLocalDensityPersonsPerSquareMeter,

    queueExposure:
      run.result.queueMetrics
        .populationQueueWaitPersonSeconds,

    completionRate:
      run.result.metrics
        .completionRate,

    unreachableCount:
      run.result.metrics
        .unreachableAgents,

    rerouteCount:
      run.result.metrics
        .totalReroutes,

    routeReversalCount:
      run.result
        .routeStability
        .totalRouteReversalEvents,

    exitUtilization:
      Object.freeze(
        run.result.metrics
          .exitUtilization.map(
            (metric) =>
              Object.freeze({
                ...metric,
              }),
          ),
      ),

    computationTimeMilliseconds,

    outputDirectory:
      artifactConfiguration
        .outputDirectory,

    runStatus:
      determineRunStatus(
        run,
      ),
  });
}

function mean(
  values:
    readonly number[],
): number {
  if (
    values.length === 0
  ) {
    throw new Error(
      "Cannot calculate a mean from an empty collection.",
    );
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
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
        value !== null,
    );

  if (
    valid.length === 0
  ) {
    return null;
  }

  return mean(
    valid,
  );
}

function aggregateStrategy(
  strategyId:
    RoutingStrategyId,
  runs:
    readonly BatchExperimentRun[],
): StrategyMetricAggregate {
  const strategyRuns =
    runs.filter(
      (run) =>
        run.strategyId ===
        strategyId,
    );

  if (
    strategyRuns.length === 0
  ) {
    throw new Error(
      `No runs are available for strategy ${strategyId}.`,
    );
  }

  const totalEvacuationTimes =
    strategyRuns.map(
      (run) =>
        run.result.metrics
          .totalEvacuationTimeSeconds,
    );

  const maximumDensities =
    strategyRuns.map(
      (run) =>
        run.result.metrics
          .maximumLocalDensityPersonsPerSquareMeter,
    );

  const completedEvacuationTimeSampleCount =
    totalEvacuationTimes.filter(
      (value) =>
        value !== null,
    ).length;

  const maximumDensitySampleCount =
    maximumDensities.filter(
      (value) =>
        value !== null,
    ).length;

  return Object.freeze({
    strategyId,

    runCount:
      strategyRuns.length,

    completedEvacuationTimeSampleCount,

    maximumDensitySampleCount,

    meanCompletionRate:
      mean(
        strategyRuns.map(
          (run) =>
            run.result.metrics
              .completionRate,
        ),
      ),

    meanTotalEvacuationTimeSeconds:
      meanNullable(
        totalEvacuationTimes,
      ),

    meanP95EvacuationTimeSeconds:
      meanNullable(
        strategyRuns.map(
          (run) =>
            run.result.metrics
              .p95EvacuationTimeSeconds,
        ),
      ),

    meanHazardExposurePersonSeconds:
      mean(
        strategyRuns.map(
          (run) =>
            run.result.metrics
              .populationHazardExposurePersonSeconds,
        ),
      ),

    meanMaximumDensityPersonsPerSquareMeter:
      meanNullable(
        maximumDensities,
      ),

    meanQueueExposurePersonSeconds:
      mean(
        strategyRuns.map(
          (run) =>
            run.result
              .queueMetrics
              .populationQueueWaitPersonSeconds,
        ),
      ),

    meanUnreachableAgents:
      mean(
        strategyRuns.map(
          (run) =>
            run.result.metrics
              .unreachableAgents,
        ),
      ),

    meanReroutes:
      mean(
        strategyRuns.map(
          (run) =>
            run.result.metrics
              .totalReroutes,
        ),
      ),

    meanRouteReversalEvents:
      mean(
        strategyRuns.map(
          (run) =>
            run.result
              .routeStability
              .totalRouteReversalEvents,
        ),
      ),
  });
}

function toCsvCell(
  value:
    | string
    | number
    | null,
): string {
  if (
    value === null
  ) {
    return "";
  }

  const text =
    String(value);

  if (
    text.includes(",") ||
    text.includes("\"") ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(
      /"/g,
      "\"\"",
    )}"`;
  }

  return text;
}

function createResultsCsv(
  records:
    readonly ExperimentRegistryRecord[],
): string {
  const headers = [
    "experimentId",
    "batchId",
    "runId",
    "experimentType",
    "scenarioInstanceId",
    "seed",
    "layoutId",
    "scenarioFamily",
    "occupancyCondition",
    "disruptionCondition",
    "strategy",
    "softwareVersion",
    "softwareCommit",
    "parameterSetVersion",
    "adaptiveThreshold",
    "totalEvacuationTime",
    "p95EvacuationTime",
    "hazardExposure",
    "maximumDensity",
    "queueExposure",
    "completionRate",
    "unreachableCount",
    "rerouteCount",
    "routeReversalCount",
    "exitUtilization",
    "computationTimeMilliseconds",
    "runStatus",
  ];

  const rows =
    records.map(
      (record) => [
        record.experimentId,
        record.batchId,
        record.runId,
        record.experimentType,
        record.scenarioInstanceId,
        record.seed,
        record.layoutId,
        record.scenarioFamily,
        record.occupancyCondition,
        record.disruptionCondition,
        record.strategy,
        record.softwareVersion,
        record.softwareCommit,
        record.parameterSetVersion,
        record.adaptiveThreshold,
        record.totalEvacuationTime,
        record.p95EvacuationTime,
        record.hazardExposure,
        record.maximumDensity,
        record.queueExposure,
        record.completionRate,
        record.unreachableCount,
        record.rerouteCount,
        record.routeReversalCount,
        JSON.stringify(
          record.exitUtilization,
        ),
        record
          .computationTimeMilliseconds,
        record.runStatus,
      ]
        .map(
          (value) =>
            toCsvCell(
              value,
            ),
        )
        .join(","),
    );

  return [
    headers.join(","),
    ...rows,
  ].join("\n");
}

function createConfigurationJson(
  batchConfiguration:
    BatchExperimentConfiguration,
  artifactConfiguration:
    ExperimentArtifactConfiguration,
): string {
  const reproducibilityConfiguration = {
    batchId:
      batchConfiguration.batchId,

    experimentType:
      artifactConfiguration
        .experimentType,

    researchQuestion:
      artifactConfiguration
        .researchQuestion,

    software:
      artifactConfiguration
        .software,

    outputDirectory:
      artifactConfiguration
        .outputDirectory,

    simulationConfiguration:
      batchConfiguration
        .simulationConfiguration ??
      {},

    strategyIds:
      batchConfiguration
        .strategyIds,

    scenarioMetadata:
      artifactConfiguration
        .scenarioMetadata,

    scenarios:
      batchConfiguration
        .scenarios,

    environment:
      batchConfiguration
        .environment,

    navigationGraph:
      batchConfiguration
        .graph,

    exits:
      batchConfiguration
        .exits,

    spawnZones:
      batchConfiguration
        .spawnZones,
  };

  return JSON.stringify(
    reproducibilityConfiguration,
    null,
    2,
  );
}

/**
 * Converts a completed BatchExperimentResult into reproducible
 * research artifacts.
 *
 * Outputs:
 *
 * - software/Git provenance
 * - experiment-registry records
 * - JSON reproducibility configuration
 * - analysis-ready CSV
 * - automatic per-strategy metric aggregation
 *
 * The function is intentionally pure with respect to the file
 * system. Browser, CLI, and server applications can decide where
 * the generated strings should be stored.
 */
export function createExperimentArtifacts(
  batchConfiguration:
    BatchExperimentConfiguration,
  batchResult:
    BatchExperimentResult,
  artifactConfiguration:
    ExperimentArtifactConfiguration,
): ExperimentArtifacts {
  validateArtifactConfiguration(
    batchConfiguration,
    batchResult,
    artifactConfiguration,
  );

  const registryRecords =
    batchResult.runs.map(
      (run) =>
        createRegistryRecord(
          run,
          batchConfiguration,
          artifactConfiguration,
        ),
    );

  const aggregateByStrategy =
    batchResult.strategyIds.map(
      (strategyId) =>
        aggregateStrategy(
          strategyId,
          batchResult.runs,
        ),
    );

  return Object.freeze({
    batchId:
      batchResult.batchId,

    configurationJson:
      createConfigurationJson(
        batchConfiguration,
        artifactConfiguration,
      ),

    resultsCsv:
      createResultsCsv(
        registryRecords,
      ),

    registryRecords:
      Object.freeze(
        registryRecords,
      ),

    aggregateByStrategy:
      Object.freeze(
        aggregateByStrategy,
      ),

    batchResult,
  });
}