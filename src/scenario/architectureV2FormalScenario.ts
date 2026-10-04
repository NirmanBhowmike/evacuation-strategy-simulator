import {
  layoutAArchitectureV2Exits,
} from "../environment/layoutAArchitectureV2Exits";

import {
  createArchitectureV2FormalPopulationBundle,
  ARCHITECTURE_V2_FORMAL_SPATIAL_BASE_SEED,
} from "../population/architectureV2FormalPopulation";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import {
  SeededRandom,
} from "../random/SeededRandom";

import {
  sampleTruncatedNormal,
} from "../random/sampleTruncatedNormal";

import {
  getArchitectureV2ResearchEnvironment,
  getArchitectureV2ResearchNavigationGraph,
} from "./architectureV2ResearchModel";

import {
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  getArchitectureV2ResearchDisruptionCondition,
} from "./architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "./architectureV2ResearchParameterSet";

import type {
  BuildingEnvironment,
} from "../types/environment";

import type {
  ExitSet,
} from "../types/exit";

import type {
  NavigationGraph,
} from "../types/navigation";

import type {
  OccupantScenarioInput,
  ScenarioInstance,
} from "../types/scenario";

import type {
  SpawnZoneSet,
} from "../types/spawn";

/**
 * Formal free-flow walking-speed distribution.
 *
 * Literature-supported benchmark:
 *
 * mean = 1.34 m/s
 * SD   = 0.26 m/s
 *
 * Bounds are implementation truncation limits chosen
 * before formal experimental execution.
 *
 * They prevent extreme tail draws without being
 * interpreted as universal physiological limits.
 */
export const ARCHITECTURE_V2_FORMAL_WALKING_SPEED =
  Object.freeze({
    mean:
      1.34,

    standardDeviation:
      0.26,

    min:
      0.60,

    max:
      2.10,
  });

/**
 * Identifies the stochastic assignment method.
 *
 * If the method ever changes after formal experiments
 * begin, it must receive a new version identifier.
 */
export const ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION =
  "agent-keyed-walking-speed-v1";

export interface ArchitectureV2FormalScenarioRequest {
  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly replicationSeed:
    number;
}

export interface ArchitectureV2FormalScenarioMetadata {
  readonly scenarioId:
    string;

  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly population:
    number;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly conditionLabel:
    string;

  readonly replicationSeed:
    number;

  readonly spatialBaseSeed:
    number;

  readonly parameterSetVersion:
    string;

  readonly speedAssignmentVersion:
    string;

  readonly walkingSpeedMeanMps:
    number;

  readonly walkingSpeedStandardDeviationMps:
    number;

  readonly walkingSpeedMinimumMps:
    number;

  readonly walkingSpeedMaximumMps:
    number;

  readonly disruptionEventCount:
    number;
}

export interface ArchitectureV2FormalScenarioBundle {
  readonly scenario:
    ScenarioInstance;

  readonly environment:
    BuildingEnvironment;

  readonly graph:
    NavigationGraph;

  readonly exits:
    ExitSet;

  readonly spawnZones:
    SpawnZoneSet;

  readonly metadata:
    ArchitectureV2FormalScenarioMetadata;
}

/**
 * Stable 32-bit FNV-1a hash.
 *
 * This is used only to deterministically derive a
 * per-agent random seed from:
 *
 * replication seed + agent ID + assignment version.
 *
 * It is not used for cryptographic purposes.
 */
function hashString(
  value:
    string,
): number {
  let hash =
    2166136261;

  for (
    let index =
      0;
    index <
      value.length;
    index +=
      1
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return (
    hash >>>
    0
  );
}

/**
 * Derives one deterministic random stream per occupant.
 *
 * This avoids dependence on population iteration length.
 *
 * Therefore, for one replication seed:
 *
 * LOW agent-0023
 * MEDIUM agent-0023
 * HIGH agent-0023
 *
 * all receive exactly the same stochastic walking speed.
 */
function deriveAgentWalkingSpeedSeed(
  replicationSeed:
    number,

  agentId:
    string,
): number {
  return hashString(
    [
      ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,
      String(
        replicationSeed,
      ),
      agentId,
    ].join(
      "|",
    ),
  );
}

function createFormalWalkingSpeed(
  replicationSeed:
    number,

  agentId:
    string,
): number {
  const agentSeed =
    deriveAgentWalkingSpeedSeed(
      replicationSeed,
      agentId,
    );

  const rng =
    new SeededRandom(
      agentSeed,
    );

  return sampleTruncatedNormal(
    rng,
    ARCHITECTURE_V2_FORMAL_WALKING_SPEED,
  );
}

function createFormalOccupants(
  spatialOccupants:
    readonly OccupantScenarioInput[],

  replicationSeed:
    number,
): readonly OccupantScenarioInput[] {
  return spatialOccupants.map(
    (
      occupant,
    ) => ({
      id:
        occupant.id,

      spawnPosition: {
        x:
          occupant
            .spawnPosition
            .x,

        y:
          occupant
            .spawnPosition
            .y,
      },

      desiredSpeedMps:
        createFormalWalkingSpeed(
          replicationSeed,
          occupant.id,
        ),
    }),
  );
}

function conditionIdToScenarioToken(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
): string {
  return conditionId
    .toLowerCase()
    .replaceAll(
      "_",
      "-",
    );
}

function createScenarioId(
  populationLevel:
    ArchitectureV2FormalPopulationLevel,

  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,

  replicationSeed:
    number,
): string {
  return [
    "layout-a-v2",
    populationLevel.toLowerCase(),
    conditionIdToScenarioToken(
      conditionId,
    ),
    `seed-${replicationSeed}`,
  ].join(
    "-",
  );
}

/**
 * Creates one complete formal Architecture V2 scenario.
 *
 * This function intentionally accepts NO routing strategy.
 *
 * The scenario is generated independently of strategy so
 * the exact same stochastic realization can be evaluated
 * under all five routing strategies.
 *
 * Inputs:
 *
 * - frozen occupancy level
 * - frozen disruption condition
 * - replication seed
 *
 * Output:
 *
 * - stochastic occupant walking speeds
 * - frozen spatial population
 * - frozen disruption schedule
 * - correct condition-specific environment
 * - correct condition-specific graph
 * - exits and spawn zones
 * - reproducibility metadata
 */
export function createArchitectureV2FormalScenario(
  request:
    ArchitectureV2FormalScenarioRequest,
): ArchitectureV2FormalScenarioBundle {
  if (
    !Number.isInteger(
      request.replicationSeed,
    )
  ) {
    throw new Error(
      "Architecture V2 formal replication seed must be an integer.",
    );
  }

  const populationBundle =
    createArchitectureV2FormalPopulationBundle(
      request.populationLevel,
    );

  if (
    populationBundle
      .scenario
      .parameterSetVersion !==
    ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION
  ) {
    throw new Error(
      "Architecture V2 formal population parameter-set version does not match the frozen research parameter set.",
    );
  }

  const condition =
    getArchitectureV2ResearchDisruptionCondition(
      request.conditionId,
    );

  const scenarioId =
    createScenarioId(
      request.populationLevel,
      request.conditionId,
      request.replicationSeed,
    );

  const occupants =
    createFormalOccupants(
      populationBundle
        .scenario
        .occupants,
      request.replicationSeed,
    );

  const disruptionSchedule =
    condition.events.map(
      (
        event,
      ) => ({
        ...event,
      }),
    );

  const scenario:
    ScenarioInstance = {
    id:
      scenarioId,

    seed:
      request.replicationSeed,

    layoutId:
      populationBundle
        .scenario
        .layoutId,

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    occupants,

    disruptionSchedule,
  };

  const environment =
    getArchitectureV2ResearchEnvironment(
      request.conditionId,
    );

  const graph =
    getArchitectureV2ResearchNavigationGraph(
      request.conditionId,
      populationBundle.graph,
    );

  if (
    environment.layoutId !==
    scenario.layoutId
  ) {
    throw new Error(
      `Formal scenario environment layout mismatch: scenario=${scenario.layoutId}, environment=${environment.layoutId}.`,
    );
  }

  if (
    graph.layoutId !==
    scenario.layoutId
  ) {
    throw new Error(
      `Formal scenario graph layout mismatch: scenario=${scenario.layoutId}, graph=${graph.layoutId}.`,
    );
  }

  if (
    populationBundle
      .spawnZones
      .layoutId !==
    scenario.layoutId
  ) {
    throw new Error(
      `Formal scenario spawn-zone layout mismatch: scenario=${scenario.layoutId}, spawnZones=${populationBundle.spawnZones.layoutId}.`,
    );
  }

  if (
    layoutAArchitectureV2Exits
      .layoutId !==
    scenario.layoutId
  ) {
    throw new Error(
      `Formal scenario exit layout mismatch: scenario=${scenario.layoutId}, exits=${layoutAArchitectureV2Exits.layoutId}.`,
    );
  }

  if (
    occupants.length !==
    populationBundle.population
  ) {
    throw new Error(
      `Formal scenario occupant count ${occupants.length} does not match frozen ${request.populationLevel} population ${populationBundle.population}.`,
    );
  }

  const metadata:
    ArchitectureV2FormalScenarioMetadata = {
    scenarioId,

    populationLevel:
      request.populationLevel,

    population:
      populationBundle.population,

    conditionId:
      request.conditionId,

    conditionLabel:
      condition.label,

    replicationSeed:
      request.replicationSeed,

    spatialBaseSeed:
      ARCHITECTURE_V2_FORMAL_SPATIAL_BASE_SEED,

    parameterSetVersion:
      ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,

    speedAssignmentVersion:
      ARCHITECTURE_V2_FORMAL_SPEED_ASSIGNMENT_VERSION,

    walkingSpeedMeanMps:
      ARCHITECTURE_V2_FORMAL_WALKING_SPEED
        .mean,

    walkingSpeedStandardDeviationMps:
      ARCHITECTURE_V2_FORMAL_WALKING_SPEED
        .standardDeviation,

    walkingSpeedMinimumMps:
      ARCHITECTURE_V2_FORMAL_WALKING_SPEED
        .min,

    walkingSpeedMaximumMps:
      ARCHITECTURE_V2_FORMAL_WALKING_SPEED
        .max,

    disruptionEventCount:
      disruptionSchedule.length,
  };

  return {
    scenario,

    environment,

    graph,

    exits:
      layoutAArchitectureV2Exits,

    spawnZones:
      populationBundle.spawnZones,

    metadata,
  };
}