import type {
  BatchExperimentResult,
} from "./batchExperiment";
import type {
  RoutingStrategyId,
} from "./routingStrategy";

export type ExperimentType =
  | "DEV"
  | "CAL"
  | "SENS"
  | "FORMAL"
  | "HOLDOUT";

export type ExperimentRunStatus =
  | "PLANNED"
  | "RUNNING"
  | "COMPLETED"
  | "UNREACHABLE_PRESENT"
  | "TIMEOUT"
  | "FAILED";

export interface SoftwareProvenance {
  /**
   * Application/package version.
   *
   * Example:
   * 1.0.0
   */
  readonly softwareVersion:
    string;

  /**
   * Git commit identifying the exact code state used for the
   * experiment.
   */
  readonly gitCommit:
    string;
}

export interface ScenarioExperimentMetadata {
  readonly scenarioId:
    string;

  readonly scenarioFamily:
    string;

  readonly occupancyCondition:
    string;

  readonly disruptionCondition:
    string;
}

export interface ExperimentArtifactConfiguration {
  readonly experimentType:
    ExperimentType;

  readonly researchQuestion:
    string;

  readonly software:
    SoftwareProvenance;

  /**
   * Logical output location recorded for reproducibility.
   *
   * The artifact generator itself does not write to disk.
   */
  readonly outputDirectory:
    string;

  readonly scenarioMetadata:
    readonly ScenarioExperimentMetadata[];

  /**
   * Optional measured execution time for individual runs.
   *
   * Key:
   * BatchExperimentRun.runId
   *
   * Value:
   * elapsed milliseconds
   *
   * This stays optional because deterministic simulation output
   * should not depend on wall-clock performance.
   */
  readonly computationTimeMillisecondsByRunId?:
    Readonly<
      Record<
        string,
        number
      >
    >;
}

export interface ExperimentRegistryRecord {
  readonly experimentId:
    string;

  readonly batchId:
    string;

  readonly runId:
    string;

  readonly experimentType:
    ExperimentType;

  readonly researchQuestion:
    string;

  readonly scenarioInstanceId:
    string;

  readonly seed:
    number;

  readonly layoutId:
    string;

  readonly scenarioFamily:
    string;

  readonly occupancyCondition:
    string;

  readonly disruptionCondition:
    string;

  readonly strategy:
    RoutingStrategyId;

  readonly softwareVersion:
    string;

  readonly softwareCommit:
    string;

  readonly parameterSetVersion:
    string;

  readonly adaptiveThreshold:
    number | null;

  readonly totalEvacuationTime:
    number | null;

  readonly p95EvacuationTime:
    number | null;

  readonly hazardExposure:
    number;

  readonly maximumDensity:
    number | null;

  readonly queueExposure:
    number;

  readonly completionRate:
    number;

  readonly unreachableCount:
    number;

  readonly rerouteCount:
    number;

  readonly routeReversalCount:
    number;

  readonly exitUtilization:
    readonly {
      readonly exitId:
        string;

      readonly evacuatedAgents:
        number;

      readonly fractionOfEvacuatedAgents:
        number;
    }[];

  readonly computationTimeMilliseconds:
    number | null;

  readonly outputDirectory:
    string;

  readonly runStatus:
    ExperimentRunStatus;
}

export interface StrategyMetricAggregate {
  readonly strategyId:
    RoutingStrategyId;

  readonly runCount:
    number;

  readonly completedEvacuationTimeSampleCount:
    number;

  readonly maximumDensitySampleCount:
    number;

  readonly meanCompletionRate:
    number;

  readonly meanTotalEvacuationTimeSeconds:
    number | null;

  readonly meanP95EvacuationTimeSeconds:
    number | null;

  readonly meanHazardExposurePersonSeconds:
    number;

  readonly meanMaximumDensityPersonsPerSquareMeter:
    number | null;

  readonly meanQueueExposurePersonSeconds:
    number;

  readonly meanUnreachableAgents:
    number;

  readonly meanReroutes:
    number;

  readonly meanRouteReversalEvents:
    number;
}

export interface ExperimentArtifacts {
  readonly batchId:
    string;

  readonly configurationJson:
    string;

  readonly resultsCsv:
    string;

  readonly registryRecords:
    readonly ExperimentRegistryRecord[];

  readonly aggregateByStrategy:
    readonly StrategyMetricAggregate[];

  /**
   * Original batch result is retained as the authoritative
   * simulation output.
   */
  readonly batchResult:
    BatchExperimentResult;
}