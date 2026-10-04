import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import type {
  ArchitectureV2FormalScenarioRequest,
} from "../scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

/**
 * Frozen identifier for the primary Architecture V2
 * factorial experiment design.
 *
 * Any methodological change after formal execution begins
 * must receive a new design version.
 */
export const ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION =
  "architecture-v2-formal-factorial-v2";

/**
 * Frozen identifier for the replication-seed policy.
 *
 * Formal seeds are intentionally separated from earlier
 * development and calibration seeds.
 */
export const ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION =
  "architecture-v2-formal-seed-bank-v1";

/**
 * Primary factorial routing strategies.
 */
export const ARCHITECTURE_V2_FORMAL_STRATEGY_IDS:
  readonly RoutingStrategyId[] =
Object.freeze([
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
]);

/**
 * Frozen Architecture V2 occupancy factor.
 */
export const ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS:
  readonly ArchitectureV2FormalPopulationLevel[] =
Object.freeze([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

/**
 * Frozen Architecture V2 disruption factor.
 *
 * Deriving this list from the frozen research parameter
 * set prevents a duplicate condition definition here.
 */
export const ARCHITECTURE_V2_FORMAL_CONDITION_IDS:
  readonly ArchitectureV2ResearchDisruptionConditionId[] =
Object.freeze(
  ARCHITECTURE_V2_RESEARCH_DISRUPTION_CONDITIONS
    .map(
      (
        condition,
      ) =>
        condition.id,
    ),
);

/**
 * Formal replication policy.
 *
 * Primary execution begins with 40 replications per
 * experimental cell.
 *
 * If convergence criteria require more observations,
 * replication count increases only in complete batches
 * of 10.
 */
export const ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL =
  40;

export const ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE =
  10;

/**
 * First seed in the formal-research namespace.
 *
 * 100001 was selected simply to keep formal execution
 * visibly separate from calibration/development seeds.
 *
 * Scientific interpretation must not depend on the
 * numeric magnitude of a seed.
 */
export const ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED =
  100001;

export interface ArchitectureV2FormalExperimentalCell {
  readonly cellId:
    string;

  readonly designVersion:
    string;

  readonly parameterSetVersion:
    string;

  readonly strategyId:
    RoutingStrategyId;

  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;
}

export interface ArchitectureV2FormalRunSpecification {
  /**
   * Unique identifier for one strategy-specific simulation
   * run.
   */
  readonly runId:
    string;

  /**
   * Pairing key shared by all five strategies evaluating
   * exactly the same stochastic ScenarioInstance.
   */
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

  readonly strategyId:
    RoutingStrategyId;

  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly replicationSeed:
    number;

  /**
   * Strategy-independent scenario request.
   *
   * All five competing strategies receive equivalent
   * requests for one pairKey.
   */
  readonly scenarioRequest:
    ArchitectureV2FormalScenarioRequest;
}

export interface ArchitectureV2FormalExperimentDesign {
  readonly designVersion:
    string;

  readonly seedBankVersion:
    string;

  readonly parameterSetVersion:
    string;

  readonly strategyIds:
    readonly RoutingStrategyId[];

  readonly populationLevels:
    readonly ArchitectureV2FormalPopulationLevel[];

  readonly conditionIds:
    readonly ArchitectureV2ResearchDisruptionConditionId[];

  readonly cells:
    readonly ArchitectureV2FormalExperimentalCell[];

  readonly seedBank:
    readonly number[];

  readonly replicationsPerCell:
    number;

  readonly totalCells:
    number;

  /**
   * Number of distinct ScenarioInstances required before
   * strategy expansion.
   *
   * occupancy × disruption × replication
   */
  readonly totalUniqueScenarios:
    number;

  /**
   * Total headless simulation executions.
   *
   * strategy × occupancy × disruption × replication
   */
  readonly totalPlannedRuns:
    number;
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

function createCellId(
  strategyId:
    RoutingStrategyId,

  populationLevel:
    ArchitectureV2FormalPopulationLevel,

  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
): string {
  return [
    "architecture-v2",
    "cell",
    normalizeToken(
      strategyId,
    ),
    normalizeToken(
      populationLevel,
    ),
    normalizeToken(
      conditionId,
    ),
  ].join(
    "__",
  );
}

function createPairKey(
  populationLevel:
    ArchitectureV2FormalPopulationLevel,

  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,

  replicationSeed:
    number,
): string {
  return [
    "architecture-v2",
    "scenario",
    normalizeToken(
      populationLevel,
    ),
    normalizeToken(
      conditionId,
    ),
    `seed-${replicationSeed}`,
  ].join(
    "__",
  );
}

function createRunId(
  cellId:
    string,

  replicationSeed:
    number,
): string {
  return [
    cellId,
    `seed-${replicationSeed}`,
  ].join(
    "__",
  );
}

/**
 * Creates a stable prefix seed bank.
 *
 * Examples:
 *
 * 40 replications:
 *   100001 ... 100040
 *
 * 50 replications:
 *   100001 ... 100050
 *
 * Extending the bank therefore never changes an earlier
 * stochastic realization.
 */
export function createArchitectureV2FormalSeedBank(
  replicationCount:
    number =
    ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL,
): readonly number[] {
  if (
    !Number.isInteger(
      replicationCount,
    )
  ) {
    throw new Error(
      "Architecture V2 formal replication count must be an integer.",
    );
  }

  if (
    replicationCount <
    ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL
  ) {
    throw new Error(
      `Architecture V2 formal replication count cannot be below ${ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL}.`,
    );
  }

  const extension =
    replicationCount -
    ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL;

  if (
    extension %
      ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE !==
    0
  ) {
    throw new Error(
      `Architecture V2 formal replications beyond the minimum must be added in batches of ${ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE}.`,
    );
  }

  return Object.freeze(
    Array.from(
      {
        length:
          replicationCount,
      },

      (
        _,
        index,
      ) =>
        ARCHITECTURE_V2_FORMAL_FIRST_REPLICATION_SEED +
        index,
    ),
  );
}

export const ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK =
  createArchitectureV2FormalSeedBank();

/**
 * Creates the frozen:
 *
 * 5 strategies
 * ×
 * 3 occupancy levels
 * ×
 * 5 disruption conditions
 *
 * = 75 experimental cells.
 *
 * Cell construction contains no stochastic realization.
 */
export function createArchitectureV2FormalExperimentalCells():
  readonly ArchitectureV2FormalExperimentalCell[] {
  const cells:
    ArchitectureV2FormalExperimentalCell[] =
  [];

  /**
   * Ordering deliberately groups the five competing
   * strategies inside each occupancy × disruption pair.
   */
  for (
    const populationLevel of
      ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS
  ) {
    for (
      const conditionId of
        ARCHITECTURE_V2_FORMAL_CONDITION_IDS
    ) {
      for (
        const strategyId of
          ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
      ) {
        cells.push({
          cellId:
            createCellId(
              strategyId,
              populationLevel,
              conditionId,
            ),

          designVersion:
            ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,

          parameterSetVersion:
            ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

          strategyId,

          populationLevel,

          conditionId,
        });
      }
    }
  }

  return Object.freeze(
    cells,
  );
}

export const ARCHITECTURE_V2_FORMAL_EXPERIMENTAL_CELLS =
  createArchitectureV2FormalExperimentalCells();

/**
 * Creates descriptors for formal simulation execution.
 *
 * This function DOES NOT run the simulator.
 *
 * It also does not construct thousands of full
 * ScenarioInstances in memory.
 *
 * Instead, each run specification records the exact
 * strategy-independent scenario request that the future
 * formal runner will construct when needed.
 */
export function createArchitectureV2FormalRunPlan(
  replicationCount:
    number =
    ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL,
): readonly ArchitectureV2FormalRunSpecification[] {
  const seedBank =
    createArchitectureV2FormalSeedBank(
      replicationCount,
    );

  const cellByFactors =
    new Map<
      string,
      ArchitectureV2FormalExperimentalCell
    >();

  for (
    const cell of
      ARCHITECTURE_V2_FORMAL_EXPERIMENTAL_CELLS
  ) {
    const key =
      [
        cell.populationLevel,
        cell.conditionId,
        cell.strategyId,
      ].join(
        "|",
      );

    cellByFactors.set(
      key,
      cell,
    );
  }

  const runs:
    ArchitectureV2FormalRunSpecification[] =
  [];

  /**
   * Run-plan ordering groups the five strategy runs for
   * one stochastic scenario together:
   *
   * population
   *   -> disruption
   *     -> replication seed
   *       -> five strategies
   */
  for (
    const populationLevel of
      ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS
  ) {
    for (
      const conditionId of
        ARCHITECTURE_V2_FORMAL_CONDITION_IDS
    ) {
      for (
        const replicationSeed of
          seedBank
      ) {
        const pairKey =
          createPairKey(
            populationLevel,
            conditionId,
            replicationSeed,
          );

        const scenarioRequest:
          ArchitectureV2FormalScenarioRequest = {
          populationLevel,

          conditionId,

          replicationSeed,
        };

        for (
          const strategyId of
            ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
        ) {
          const cellKey =
            [
              populationLevel,
              conditionId,
              strategyId,
            ].join(
              "|",
            );

          const cell =
            cellByFactors.get(
              cellKey,
            );

          if (!cell) {
            throw new Error(
              `Architecture V2 formal experimental cell not found for ${cellKey}.`,
            );
          }

          runs.push({
            runId:
              createRunId(
                cell.cellId,
                replicationSeed,
              ),

            pairKey,

            cellId:
              cell.cellId,

            designVersion:
              ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,

            seedBankVersion:
              ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,

            parameterSetVersion:
              ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

            strategyId,

            populationLevel,

            conditionId,

            replicationSeed,

            scenarioRequest: {
              ...scenarioRequest,
            },
          });
        }
      }
    }
  }

  return Object.freeze(
    runs,
  );
}

/**
 * Creates experiment-level metadata without executing any
 * simulations.
 */
export function createArchitectureV2FormalExperimentDesign(
  replicationCount:
    number =
    ARCHITECTURE_V2_FORMAL_MINIMUM_REPLICATIONS_PER_CELL,
): ArchitectureV2FormalExperimentDesign {
  const seedBank =
    createArchitectureV2FormalSeedBank(
      replicationCount,
    );

  const cells =
    ARCHITECTURE_V2_FORMAL_EXPERIMENTAL_CELLS;

  const totalUniqueScenarios =
    ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS
      .length *
    ARCHITECTURE_V2_FORMAL_CONDITION_IDS
      .length *
    seedBank.length;

  const totalPlannedRuns =
    totalUniqueScenarios *
    ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
      .length;

  return {
    designVersion:
      ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,

    seedBankVersion:
      ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    strategyIds:
      ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,

    populationLevels:
      ARCHITECTURE_V2_FORMAL_POPULATION_LEVELS,

    conditionIds:
      ARCHITECTURE_V2_FORMAL_CONDITION_IDS,

    cells,

    seedBank,

    replicationsPerCell:
      replicationCount,

    totalCells:
      cells.length,

    totalUniqueScenarios,

    totalPlannedRuns,
  };
}