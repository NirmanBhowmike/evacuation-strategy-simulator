import {
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
  ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
  createArchitectureV2FormalRunPlan,
} from "./architectureV2FormalExperimentDesign";

import type {
  ArchitectureV2FormalRunSpecification,
} from "./architectureV2FormalExperimentDesign";

import {
  runArchitectureV2FormalExperiment,
  runArchitectureV2FormalPair,
} from "./architectureV2FormalExperimentRunner";

import type {
  ArchitectureV2FormalRunResult,
} from "./architectureV2FormalExperimentRunner";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

export type ArchitectureV2FormalExecutionScope =
  | "PAIR"
  | "CELL"
  | "REPLICATION_BATCH"
  | "FULL_INITIAL";

export interface ArchitectureV2FormalPairExecutionRequest {
  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly replicationSeed:
    number;
}

export interface ArchitectureV2FormalCellExecutionRequest {
  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly strategyId:
    RoutingStrategyId;
}

export interface ArchitectureV2FormalReplicationBatchRequest {
  /**
   * One-based batch number.
   *
   * Initial 40-replication experiment:
   *
   * batch 1 -> seeds 100001-100010
   * batch 2 -> seeds 100011-100020
   * batch 3 -> seeds 100021-100030
   * batch 4 -> seeds 100031-100040
   */
  readonly batchNumber:
    number;
}

export interface ArchitectureV2FormalExecutionProgress {
  readonly completedRuns:
    number;

  readonly totalRuns:
    number;

  readonly completedGroups:
    number;

  readonly totalGroups:
    number;

  readonly latestPairKey:
    string;

  readonly latestRunIds:
    readonly string[];
}

export interface ArchitectureV2FormalExecutionOptions {
  readonly onProgress?:
    (
      progress:
        ArchitectureV2FormalExecutionProgress,
    ) => void;
}

export interface ArchitectureV2FormalExecutionSummary {
  readonly scope:
    ArchitectureV2FormalExecutionScope;

  readonly totalRuns:
    number;

  readonly completedRuns:
    number;

  readonly completedRunCount:
    number;

  readonly unreachablePresentRunCount:
    number;

  readonly timeoutRunCount:
    number;

  readonly results:
    readonly ArchitectureV2FormalRunResult[];
}

interface GroupedSpecifications {
  readonly pairKey:
    string;

  readonly specifications:
    readonly ArchitectureV2FormalRunSpecification[];
}

function requireInitialFormalSeed(
  seed:
    number,
): void {
  if (
    !ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
      .includes(
        seed,
      )
  ) {
    throw new Error(
      `Replication seed ${seed} is not part of the frozen initial Architecture V2 formal seed bank.`,
    );
  }
}

function groupSpecificationsByPairKey(
  specifications:
    readonly ArchitectureV2FormalRunSpecification[],
): readonly GroupedSpecifications[] {
  const groups =
    new Map<
      string,
      ArchitectureV2FormalRunSpecification[]
    >();

  const ordering:
    string[] =
  [];

  for (
    const specification of
      specifications
  ) {
    let group =
      groups.get(
        specification.pairKey,
      );

    if (!group) {
      group =
        [];

      groups.set(
        specification.pairKey,
        group,
      );

      ordering.push(
        specification.pairKey,
      );
    }

    group.push(
      specification,
    );
  }

  return ordering.map(
    (
      pairKey,
    ) => ({
      pairKey,

      specifications:
        groups.get(
          pairKey,
        ) ??
        [],
    }),
  );
}

function isCompleteFormalPair(
  specifications:
    readonly ArchitectureV2FormalRunSpecification[],
): boolean {
  if (
    specifications.length !==
    ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
      .length
  ) {
    return false;
  }

  const strategyIds =
    specifications.map(
      (
        specification,
      ) =>
        specification.strategyId,
    );

  if (
    new Set(
      strategyIds,
    ).size !==
    ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
      .length
  ) {
    return false;
  }

  return ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    .every(
      (
        strategyId,
      ) =>
        strategyIds.includes(
          strategyId,
        ),
    );
}

function validateExecutionSpecifications(
  specifications:
    readonly ArchitectureV2FormalRunSpecification[],
): void {
  if (
    specifications.length ===
    0
  ) {
    throw new Error(
      "Architecture V2 formal execution requires at least one run specification.",
    );
  }

  const runIds =
    specifications.map(
      (
        specification,
      ) =>
        specification.runId,
    );

  if (
    new Set(
      runIds,
    ).size !==
    runIds.length
  ) {
    throw new Error(
      "Architecture V2 formal execution contains duplicate run identifiers.",
    );
  }
}

function createSummary(
  scope:
    ArchitectureV2FormalExecutionScope,

  results:
    readonly ArchitectureV2FormalRunResult[],
): ArchitectureV2FormalExecutionSummary {
  return {
    scope,

    totalRuns:
      results.length,

    completedRuns:
      results.length,

    completedRunCount:
      results.filter(
        (
          result,
        ) =>
          result.runStatus ===
          "COMPLETED",
      ).length,

    unreachablePresentRunCount:
      results.filter(
        (
          result,
        ) =>
          result.runStatus ===
          "UNREACHABLE_PRESENT",
      ).length,

    timeoutRunCount:
      results.filter(
        (
          result,
        ) =>
          result.runStatus ===
          "TIMEOUT",
      ).length,

    results,
  };
}

/**
 * Executes a selected set of formal run specifications.
 *
 * Complete five-strategy pair groups are executed through
 * runArchitectureV2FormalPair(), causing the stochastic
 * ScenarioInstance to be constructed exactly once for the
 * five competing strategies.
 *
 * Partial groups, such as one strategy-specific factorial
 * cell, are executed independently.
 */
export function executeArchitectureV2FormalSpecifications(
  scope:
    ArchitectureV2FormalExecutionScope,

  specifications:
    readonly ArchitectureV2FormalRunSpecification[],

  options:
    ArchitectureV2FormalExecutionOptions =
    {},
): ArchitectureV2FormalExecutionSummary {
  validateExecutionSpecifications(
    specifications,
  );

  const groups =
    groupSpecificationsByPairKey(
      specifications,
    );

  const resultByRunId =
    new Map<
      string,
      ArchitectureV2FormalRunResult
    >();

  let completedRuns =
    0;

  let completedGroups =
    0;

  for (
    const group of
      groups
  ) {
    let groupResults:
      readonly ArchitectureV2FormalRunResult[];

    if (
      isCompleteFormalPair(
        group.specifications,
      )
    ) {
      groupResults =
        runArchitectureV2FormalPair(
          group.specifications,
        );
    } else {
      groupResults =
        group.specifications.map(
          (
            specification,
          ) =>
            runArchitectureV2FormalExperiment(
              specification,
            ),
        );
    }

    for (
      const result of
        groupResults
    ) {
      if (
        resultByRunId.has(
          result.runId,
        )
      ) {
        throw new Error(
          `Architecture V2 formal executor produced duplicate result for run ${result.runId}.`,
        );
      }

      resultByRunId.set(
        result.runId,
        result,
      );
    }

    completedRuns +=
      groupResults.length;

    completedGroups +=
      1;

    options.onProgress?.({
      completedRuns,

      totalRuns:
        specifications.length,

      completedGroups,

      totalGroups:
        groups.length,

      latestPairKey:
        group.pairKey,

      latestRunIds:
        groupResults.map(
          (
            result,
          ) =>
            result.runId,
        ),
    });
  }

  /**
   * Restore exact input run-plan ordering.
   */
  const orderedResults =
    specifications.map(
      (
        specification,
      ) => {
        const result =
          resultByRunId.get(
            specification.runId,
          );

        if (!result) {
          throw new Error(
            `Architecture V2 formal executor is missing result for run ${specification.runId}.`,
          );
        }

        return result;
      },
    );

  return createSummary(
    scope,
    orderedResults,
  );
}

/**
 * Creates the five-strategy plan for one stochastic
 * scenario.
 */
export function createArchitectureV2FormalPairExecutionPlan(
  request:
    ArchitectureV2FormalPairExecutionRequest,
): readonly ArchitectureV2FormalRunSpecification[] {
  requireInitialFormalSeed(
    request.replicationSeed,
  );

  const plan =
    createArchitectureV2FormalRunPlan();

  const specifications =
    plan.filter(
      (
        specification,
      ) =>
        specification.populationLevel ===
          request.populationLevel &&
        specification.conditionId ===
          request.conditionId &&
        specification.replicationSeed ===
          request.replicationSeed,
    );

  if (
    specifications.length !==
    ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
      .length
  ) {
    throw new Error(
      `Expected ${ARCHITECTURE_V2_FORMAL_STRATEGY_IDS.length} formal paired runs, found ${specifications.length}.`,
    );
  }

  return specifications;
}

export function executeArchitectureV2FormalPair(
  request:
    ArchitectureV2FormalPairExecutionRequest,

  options:
    ArchitectureV2FormalExecutionOptions =
    {},
): ArchitectureV2FormalExecutionSummary {
  return executeArchitectureV2FormalSpecifications(
    "PAIR",
    createArchitectureV2FormalPairExecutionPlan(
      request,
    ),
    options,
  );
}

/**
 * Creates the 40-run plan for one factorial cell:
 *
 * one strategy
 * × one occupancy level
 * × one disruption condition
 * × 40 frozen initial seeds.
 */
export function createArchitectureV2FormalCellExecutionPlan(
  request:
    ArchitectureV2FormalCellExecutionRequest,
): readonly ArchitectureV2FormalRunSpecification[] {
  const specifications =
    createArchitectureV2FormalRunPlan()
      .filter(
        (
          specification,
        ) =>
          specification.populationLevel ===
            request.populationLevel &&
          specification.conditionId ===
            request.conditionId &&
          specification.strategyId ===
            request.strategyId,
      );

  if (
    specifications.length !==
    ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
      .length
  ) {
    throw new Error(
      `Expected ${ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK.length} runs in one formal experimental cell, found ${specifications.length}.`,
    );
  }

  return specifications;
}

export function executeArchitectureV2FormalCell(
  request:
    ArchitectureV2FormalCellExecutionRequest,

  options:
    ArchitectureV2FormalExecutionOptions =
    {},
): ArchitectureV2FormalExecutionSummary {
  return executeArchitectureV2FormalSpecifications(
    "CELL",
    createArchitectureV2FormalCellExecutionPlan(
      request,
    ),
    options,
  );
}

/**
 * Creates one 10-seed replication batch across the entire
 * 75-cell factorial design.
 *
 * One batch therefore contains:
 *
 * 10 seeds × 75 cells = 750 simulation runs.
 */
export function createArchitectureV2FormalReplicationBatchPlan(
  request:
    ArchitectureV2FormalReplicationBatchRequest,
): readonly ArchitectureV2FormalRunSpecification[] {
  if (
    !Number.isInteger(
      request.batchNumber,
    )
  ) {
    throw new Error(
      "Architecture V2 formal replication batch number must be an integer.",
    );
  }

  const batchSize =
    ARCHITECTURE_V2_FORMAL_REPLICATION_EXTENSION_BATCH_SIZE;

  const batchCount =
    ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
      .length /
    batchSize;

  if (
    request.batchNumber <
      1 ||
    request.batchNumber >
      batchCount
  ) {
    throw new Error(
      `Architecture V2 initial formal replication batch number must be between 1 and ${batchCount}.`,
    );
  }

  const startIndex =
    (
      request.batchNumber -
      1
    ) *
    batchSize;

  const batchSeeds =
    ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK
      .slice(
        startIndex,
        startIndex +
          batchSize,
      );

  const seedSet =
    new Set(
      batchSeeds,
    );

  const specifications =
    createArchitectureV2FormalRunPlan()
      .filter(
        (
          specification,
        ) =>
          seedSet.has(
            specification.replicationSeed,
          ),
      );

  const expectedRunCount =
    batchSize *
    75;

  if (
    specifications.length !==
    expectedRunCount
  ) {
    throw new Error(
      `Expected ${expectedRunCount} runs in formal replication batch ${request.batchNumber}, found ${specifications.length}.`,
    );
  }

  return specifications;
}

export function executeArchitectureV2FormalReplicationBatch(
  request:
    ArchitectureV2FormalReplicationBatchRequest,

  options:
    ArchitectureV2FormalExecutionOptions =
    {},
): ArchitectureV2FormalExecutionSummary {
  return executeArchitectureV2FormalSpecifications(
    "REPLICATION_BATCH",
    createArchitectureV2FormalReplicationBatchPlan(
      request,
    ),
    options,
  );
}

/**
 * Returns the complete frozen initial 3,000-run plan.
 */
export function createArchitectureV2FormalInitialExecutionPlan():
  readonly ArchitectureV2FormalRunSpecification[] {
  const specifications =
    createArchitectureV2FormalRunPlan();

  if (
    specifications.length !==
    3000
  ) {
    throw new Error(
      `Expected 3000 initial Architecture V2 formal runs, found ${specifications.length}.`,
    );
  }

  return specifications;
}

/**
 * Executes the complete 3,000-run initial formal
 * experiment.
 *
 * Do not invoke this until the controlled executor has
 * passed validation and the exact formal code revision has
 * been checkpointed.
 */
export function executeArchitectureV2FormalInitialExperiment(
  options:
    ArchitectureV2FormalExecutionOptions =
    {},
): ArchitectureV2FormalExecutionSummary {
  return executeArchitectureV2FormalSpecifications(
    "FULL_INITIAL",
    createArchitectureV2FormalInitialExecutionPlan(),
    options,
  );
}