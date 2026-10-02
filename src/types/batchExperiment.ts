import type {
  BuildingEnvironment,
} from "./environment";
import type {
  ExitSet,
} from "./exit";
import type {
  HeadlessSimulationConfiguration,
  HeadlessSimulationResult,
} from "./headlessSimulation";
import type {
  NavigationGraph,
} from "./navigation";
import type {
  RoutingStrategyId,
} from "./routingStrategy";
import type {
  ScenarioInstance,
} from "./scenario";
import type {
  SpawnZoneSet,
} from "./spawn";

export interface BatchExperimentConfiguration {
  /**
   * Human-readable deterministic identifier for this batch.
   */
  readonly batchId: string;

  /**
   * Immutable scenario instances.
   *
   * Each scenario is reused across all requested strategies to
   * preserve paired/common-random-number comparisons.
   */
  readonly scenarios:
    readonly ScenarioInstance[];

  /**
   * Strategies evaluated for every scenario instance.
   */
  readonly strategyIds:
    readonly RoutingStrategyId[];

  readonly environment:
    BuildingEnvironment;

  readonly graph:
    NavigationGraph;

  readonly exits:
    ExitSet;

  readonly spawnZones:
    SpawnZoneSet;

  /**
   * Shared simulation settings applied to every run.
   *
   * strategyId is excluded because the batch runner assigns it
   * independently for each strategy.
   */
  readonly simulationConfiguration?:
    Omit<
      HeadlessSimulationConfiguration,
      "strategyId"
    >;
}

export interface BatchExperimentRun {
  /**
   * Unique deterministic identifier for one scenario-strategy
   * combination.
   */
  readonly runId: string;

  /**
   * Scenario identifier used as the pairing key across
   * strategies.
   */
  readonly pairKey: string;

  readonly scenarioId: string;

  readonly parameterSetId: string;

  readonly seed: number;

  readonly strategyId:
    RoutingStrategyId;

  readonly result:
    HeadlessSimulationResult;
}

export interface BatchExperimentResult {
  readonly batchId: string;

  readonly totalScenarios:
    number;

  readonly totalStrategies:
    number;

  readonly totalRuns:
    number;

  readonly scenarioIds:
    readonly string[];

  readonly parameterSetIds:
    readonly string[];

  readonly strategyIds:
    readonly RoutingStrategyId[];

  readonly runs:
    readonly BatchExperimentRun[];
}