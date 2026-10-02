import {
  runHeadlessSimulation,
} from "./runHeadlessSimulation";

import type {
  BatchExperimentConfiguration,
  BatchExperimentResult,
  BatchExperimentRun,
} from "../types/batchExperiment";
import type {
  RoutingStrategyId,
} from "../types/routingStrategy";
import type {
  ScenarioInstance,
} from "../types/scenario";

function validateNonEmptyId(
  value: string,
  label: string,
): void {
  if (!value.trim()) {
    throw new Error(
      `${label} must be non-empty.`,
    );
  }
}

function validateUniqueScenarioIds(
  scenarios:
    readonly ScenarioInstance[],
): void {
  const ids =
    new Set<string>();

  for (
    const scenario of scenarios
  ) {
    validateNonEmptyId(
      scenario.id,
      "Scenario id",
    );

    validateNonEmptyId(
      scenario.parameterSetVersion,
      `Parameter-set id for scenario ${scenario.id}`,
    );

    if (
      ids.has(
        scenario.id,
      )
    ) {
      throw new Error(
        `Duplicate scenario id: ${scenario.id}`,
      );
    }

    ids.add(
      scenario.id,
    );
  }
}

function validateUniqueStrategies(
  strategyIds:
    readonly RoutingStrategyId[],
): void {
  const ids =
    new Set<
      RoutingStrategyId
    >();

  for (
    const strategyId of
      strategyIds
  ) {
    if (
      ids.has(
        strategyId,
      )
    ) {
      throw new Error(
        `Duplicate routing strategy in batch: ${strategyId}`,
      );
    }

    ids.add(
      strategyId,
    );
  }
}

function validateLayouts(
  configuration:
    BatchExperimentConfiguration,
): void {
  const {
    environment,
    graph,
    exits,
    spawnZones,
  } = configuration;

  if (
    environment.layoutId !==
      graph.layoutId ||
    environment.layoutId !==
      exits.layoutId ||
    environment.layoutId !==
      spawnZones.layoutId
  ) {
    throw new Error(
      "Batch environment, navigation graph, exits, and spawn zones must use the same layout.",
    );
  }

  for (
    const scenario of
      configuration.scenarios
  ) {
    if (
      scenario.layoutId !==
      environment.layoutId
    ) {
      throw new Error(
        `Scenario ${scenario.id} does not match the batch layout.`,
      );
    }
  }
}

function validateConfiguration(
  configuration:
    BatchExperimentConfiguration,
): void {
  validateNonEmptyId(
    configuration.batchId,
    "Batch id",
  );

  if (
    configuration.scenarios
      .length === 0
  ) {
    throw new Error(
      "Batch experiment requires at least one scenario.",
    );
  }

  if (
    configuration.strategyIds
      .length === 0
  ) {
    throw new Error(
      "Batch experiment requires at least one routing strategy.",
    );
  }

  validateUniqueScenarioIds(
    configuration.scenarios,
  );

  validateUniqueStrategies(
    configuration.strategyIds,
  );

  validateLayouts(
    configuration,
  );
}

function createRunId(
  scenarioId: string,
  strategyId:
    RoutingStrategyId,
): string {
  return `${scenarioId}__${strategyId}`;
}

/**
 * Runs the full Scenario × Strategy experiment matrix.
 *
 * Experimental fairness:
 *
 * A ScenarioInstance is not regenerated separately for each
 * strategy. The exact same immutable scenario is passed into
 * every strategy-specific headless run.
 *
 * Therefore paired strategies share:
 *
 * - scenario id
 * - seed
 * - occupant population
 * - desired walking speeds
 * - spawn positions
 * - disruption schedule
 * - parameter-set id
 *
 * Only the routing strategy changes unless the caller explicitly
 * changes another batch-level simulation parameter.
 */
export function runBatchExperiment(
  configuration:
    BatchExperimentConfiguration,
): BatchExperimentResult {
  validateConfiguration(
    configuration,
  );

  const runs:
    BatchExperimentRun[] = [];

  for (
    const scenario of
      configuration.scenarios
  ) {
    for (
      const strategyId of
        configuration.strategyIds
    ) {
      const result =
        runHeadlessSimulation({
          scenario,

          environment:
            configuration.environment,

          graph:
            configuration.graph,

          exits:
            configuration.exits,

          spawnZones:
            configuration.spawnZones,

          configuration: {
            ...configuration
              .simulationConfiguration,

            strategyId,
          },
        });

      const runId =
        createRunId(
          scenario.id,
          strategyId,
        );

      runs.push(
        Object.freeze({
          runId,

          pairKey:
            scenario.id,

          scenarioId:
            scenario.id,

          parameterSetId:
            scenario
              .parameterSetVersion,

          seed:
            scenario.seed,

          strategyId,

          result,
        }),
      );
    }
  }

  const scenarioIds =
    configuration.scenarios.map(
      (scenario) =>
        scenario.id,
    );

  const parameterSetIds =
    Array.from(
      new Set(
        configuration.scenarios.map(
          (scenario) =>
            scenario
              .parameterSetVersion,
        ),
      ),
    );

  return Object.freeze({
    batchId:
      configuration.batchId,

    totalScenarios:
      configuration.scenarios
        .length,

    totalStrategies:
      configuration.strategyIds
        .length,

    totalRuns:
      runs.length,

    scenarioIds:
      Object.freeze([
        ...scenarioIds,
      ]),

    parameterSetIds:
      Object.freeze([
        ...parameterSetIds,
      ]),

    strategyIds:
      Object.freeze([
        ...configuration
          .strategyIds,
      ]),

    runs:
      Object.freeze(
        runs,
      ),
  });
}