import {
  runHeadlessSimulation,
} from "../core/runHeadlessSimulation";

import type {
  ArchitectureV2FormalRunSpecification,
} from "./architectureV2FormalExperimentDesign";

import {
  ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION,
  ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION,
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "./architectureV2FormalExperimentDesign";

import {
  createArchitectureV2FormalScenario,
} from "../scenario/architectureV2FormalScenario";

import type {
  ArchitectureV2FormalScenarioBundle,
} from "../scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  HeadlessSimulationResult,
} from "../types/headlessSimulation";

import type {
  ExitUtilizationMetric,
} from "../types/metrics";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

import type {
  SimulationTerminationReason,
} from "../types/termination";

/**
 * Formal Architecture V2 maximum simulation duration.
 *
 * This matches the 180-second limit used during the
 * frozen Architecture V2 validation and calibration
 * regressions.
 */
export const ARCHITECTURE_V2_FORMAL_MAXIMUM_SIMULATION_TIME_SECONDS =
  180;

export type ArchitectureV2FormalRunStatus =
  | "COMPLETED"
  | "UNREACHABLE_PRESENT"
  | "TIMEOUT";

export interface ArchitectureV2FormalRunMetrics {
  readonly totalEvacuationTimeSeconds:
    number | null;

  readonly meanEvacuationTimeSeconds:
    number | null;

  readonly p95EvacuationTimeSeconds:
    number | null;

  readonly completionRate:
    number;

  readonly evacuatedAgents:
    number;

  readonly unreachableAgents:
    number;

  readonly timeoutAgents:
    number;

  readonly populationHazardExposurePersonSeconds:
    number;

  readonly meanHazardExposureSeconds:
    number;

  readonly maximumLocalDensityPersonsPerSquareMeter:
    number | null;

  readonly populationQueueWaitPersonSeconds:
    number;

  readonly meanQueueWaitSeconds:
    number;

  readonly maximumQueueWaitSeconds:
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

export interface ArchitectureV2FormalRunResult {
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

  readonly scenarioId:
    string;

  readonly replicationSeed:
    number;

  readonly populationLevel:
    ArchitectureV2FormalRunSpecification["populationLevel"];

  readonly population:
    number;

  readonly conditionId:
    ArchitectureV2FormalRunSpecification["conditionId"];

  readonly strategyId:
    RoutingStrategyId;

  readonly runStatus:
    ArchitectureV2FormalRunStatus;

  readonly terminationReason:
    SimulationTerminationReason;

  readonly simulatedTimeSeconds:
    number;

  readonly ticks:
    number;

  readonly appliedDisruptionCount:
    number;

  readonly metrics:
    ArchitectureV2FormalRunMetrics;

  readonly simulation:
    HeadlessSimulationResult;
}

function determineFormalRunStatus(
  result:
    HeadlessSimulationResult,
): ArchitectureV2FormalRunStatus {
  if (
    result.termination
      .reason ===
    "TIMEOUT"
  ) {
    return "TIMEOUT";
  }

  if (
    result.metrics
      .unreachableAgents >
    0
  ) {
    return "UNREACHABLE_PRESENT";
  }

  return "COMPLETED";
}

function validateRunSpecification(
  specification:
    ArchitectureV2FormalRunSpecification,
): void {
  if (
    specification.designVersion !==
    ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION
  ) {
    throw new Error(
      `Formal run design-version mismatch: expected ${ARCHITECTURE_V2_FORMAL_EXPERIMENT_DESIGN_VERSION}, received ${specification.designVersion}.`,
    );
  }

  if (
    specification.seedBankVersion !==
    ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION
  ) {
    throw new Error(
      `Formal run seed-bank version mismatch: expected ${ARCHITECTURE_V2_FORMAL_SEED_BANK_VERSION}, received ${specification.seedBankVersion}.`,
    );
  }

  if (
    specification.parameterSetVersion !==
    ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION
  ) {
    throw new Error(
      `Formal run parameter-set mismatch: expected ${ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION}, received ${specification.parameterSetVersion}.`,
    );
  }

  if (
    !ARCHITECTURE_V2_FORMAL_STRATEGY_IDS.includes(
      specification.strategyId,
    )
  ) {
    throw new Error(
      `Unsupported Architecture V2 formal strategy: ${specification.strategyId}.`,
    );
  }

  if (
    specification.scenarioRequest
      .populationLevel !==
    specification.populationLevel
  ) {
    throw new Error(
      "Formal run population level does not match its scenario request.",
    );
  }

  if (
    specification.scenarioRequest
      .conditionId !==
    specification.conditionId
  ) {
    throw new Error(
      "Formal run disruption condition does not match its scenario request.",
    );
  }

  if (
    specification.scenarioRequest
      .replicationSeed !==
    specification.replicationSeed
  ) {
    throw new Error(
      "Formal run replication seed does not match its scenario request.",
    );
  }
}

function validateScenarioBundleForSpecification(
  specification:
    ArchitectureV2FormalRunSpecification,

  formalScenario:
    ArchitectureV2FormalScenarioBundle,
): void {
  if (
    formalScenario.metadata
      .populationLevel !==
    specification.populationLevel
  ) {
    throw new Error(
      "Formal scenario population level does not match the run specification.",
    );
  }

  if (
    formalScenario.metadata
      .conditionId !==
    specification.conditionId
  ) {
    throw new Error(
      "Formal scenario disruption condition does not match the run specification.",
    );
  }

  if (
    formalScenario.metadata
      .replicationSeed !==
    specification.replicationSeed
  ) {
    throw new Error(
      "Formal scenario replication seed does not match the run specification.",
    );
  }

  if (
    formalScenario.metadata
      .parameterSetVersion !==
    ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION
  ) {
    throw new Error(
      "Formal scenario parameter-set version does not match the frozen Architecture V2 research model.",
    );
  }
}

function flattenFormalMetrics(
  result:
    HeadlessSimulationResult,
): ArchitectureV2FormalRunMetrics {
  return {
    totalEvacuationTimeSeconds:
      result.metrics
        .totalEvacuationTimeSeconds,

    meanEvacuationTimeSeconds:
      result.metrics
        .meanEvacuationTimeSeconds,

    p95EvacuationTimeSeconds:
      result.metrics
        .p95EvacuationTimeSeconds,

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
      result.queueMetrics
        .populationQueueWaitPersonSeconds,

    meanQueueWaitSeconds:
      result.queueMetrics
        .meanQueueWaitSeconds,

    maximumQueueWaitSeconds:
      result.queueMetrics
        .maximumQueueWaitSeconds,

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
      result.routeStability
        .totalAcceptedReroutes,

    totalExitTargetChanges:
      result.routeStability
        .totalExitTargetChanges,

    totalRouteReversalEvents:
      result.routeStability
        .totalRouteReversalEvents,

    exitUtilization:
      result.metrics
        .exitUtilization,
  };
}

/**
 * Executes one strategy against an already-created formal
 * ScenarioInstance bundle.
 *
 * This is deliberately separate from scenario generation
 * so paired strategy comparisons can literally reuse the
 * same generated stochastic scenario.
 */
function runSpecificationWithFormalScenario(
  specification:
    ArchitectureV2FormalRunSpecification,

  formalScenario:
    ArchitectureV2FormalScenarioBundle,
): ArchitectureV2FormalRunResult {
  validateRunSpecification(
    specification,
  );

  validateScenarioBundleForSpecification(
    specification,
    formalScenario,
  );

  const simulation =
    runHeadlessSimulation({
      scenario:
        formalScenario.scenario,

      environment:
        formalScenario.environment,

      graph:
        formalScenario.graph,

      exits:
        formalScenario.exits,

      spawnZones:
        formalScenario.spawnZones,

      configuration: {
        strategyId:
          specification.strategyId,

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

  if (
    simulation.strategyId !==
    specification.strategyId
  ) {
    throw new Error(
      `Formal run strategy mismatch: expected ${specification.strategyId}, received ${simulation.strategyId}.`,
    );
  }

  if (
    simulation.seed !==
    specification.replicationSeed
  ) {
    throw new Error(
      `Formal run seed mismatch: expected ${specification.replicationSeed}, received ${simulation.seed}.`,
    );
  }

  if (
    simulation.parameterSetId !==
    ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION
  ) {
    throw new Error(
      `Formal run returned unexpected parameter set: ${simulation.parameterSetId}.`,
    );
  }

  if (
    simulation.scenarioId !==
    formalScenario.scenario.id
  ) {
    throw new Error(
      "Formal run returned a scenario identifier different from the generated ScenarioInstance.",
    );
  }

  if (
    simulation.metrics
      .totalAgents !==
    formalScenario.metadata
      .population
  ) {
    throw new Error(
      `Formal run population mismatch: expected ${formalScenario.metadata.population}, received ${simulation.metrics.totalAgents}.`,
    );
  }

  return {
    runId:
      specification.runId,

    pairKey:
      specification.pairKey,

    cellId:
      specification.cellId,

    designVersion:
      specification.designVersion,

    seedBankVersion:
      specification.seedBankVersion,

    parameterSetVersion:
      specification.parameterSetVersion,

    scenarioId:
      simulation.scenarioId,

    replicationSeed:
      specification.replicationSeed,

    populationLevel:
      specification.populationLevel,

    population:
      formalScenario.metadata
        .population,

    conditionId:
      specification.conditionId,

    strategyId:
      specification.strategyId,

    runStatus:
      determineFormalRunStatus(
        simulation,
      ),

    terminationReason:
      simulation.termination
        .reason,

    simulatedTimeSeconds:
      simulation.simulatedTimeSeconds,

    ticks:
      simulation.ticks,

    appliedDisruptionCount:
      simulation.appliedDisruptions
        .length,

    metrics:
      flattenFormalMetrics(
        simulation,
      ),

    simulation,
  };
}

/**
 * Executes exactly one Architecture V2 formal run.
 */
export function runArchitectureV2FormalExperiment(
  specification:
    ArchitectureV2FormalRunSpecification,
): ArchitectureV2FormalRunResult {
  validateRunSpecification(
    specification,
  );

  const formalScenario =
    createArchitectureV2FormalScenario(
      specification.scenarioRequest,
    );

  return runSpecificationWithFormalScenario(
    specification,
    formalScenario,
  );
}

/**
 * Executes one complete five-strategy paired comparison.
 *
 * One stochastic Architecture V2 formal scenario is
 * generated exactly once.
 *
 * That same immutable scenario bundle is then supplied to
 * all five routing strategies.
 */
export function runArchitectureV2FormalPair(
  specifications:
    readonly ArchitectureV2FormalRunSpecification[],
): readonly ArchitectureV2FormalRunResult[] {
  if (
    specifications.length !==
    ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
      .length
  ) {
    throw new Error(
      `Architecture V2 formal paired execution requires exactly ${ARCHITECTURE_V2_FORMAL_STRATEGY_IDS.length} strategy runs.`,
    );
  }

  const first =
    specifications[0];

  if (!first) {
    throw new Error(
      "Architecture V2 formal paired execution received no specifications.",
    );
  }

  const expectedScenarioRequest =
    JSON.stringify(
      first.scenarioRequest,
    );

  for (
    const specification of
      specifications
  ) {
    validateRunSpecification(
      specification,
    );

    if (
      specification.pairKey !==
      first.pairKey
    ) {
      throw new Error(
        "Architecture V2 formal paired execution requires one shared pairKey.",
      );
    }

    if (
      JSON.stringify(
        specification.scenarioRequest,
      ) !==
      expectedScenarioRequest
    ) {
      throw new Error(
        "Architecture V2 formal paired execution requires identical scenario requests.",
      );
    }
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
    throw new Error(
      "Architecture V2 formal paired execution requires five unique routing strategies.",
    );
  }

  for (
    const requiredStrategy of
      ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
  ) {
    if (
      !strategyIds.includes(
        requiredStrategy,
      )
    ) {
      throw new Error(
        `Architecture V2 formal paired execution is missing strategy ${requiredStrategy}.`,
      );
    }
  }

  /**
   * Create the stochastic ScenarioInstance exactly once.
   */
  const formalScenario =
    createArchitectureV2FormalScenario(
      first.scenarioRequest,
    );

  /**
   * Preserve frozen strategy ordering regardless of
   * caller ordering.
   */
  return ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
    .map(
      (
        strategyId,
      ) => {
        const specification =
          specifications.find(
            (
              candidate,
            ) =>
              candidate.strategyId ===
              strategyId,
          );

        if (!specification) {
          throw new Error(
            `Formal paired execution could not find strategy ${strategyId}.`,
          );
        }

        return runSpecificationWithFormalScenario(
          specification,
          formalScenario,
        );
      },
    );
}