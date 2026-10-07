import {
  runHeadlessSimulation,
} from "../core/runHeadlessSimulation";

import {
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK,
} from "../experiment/architectureV2FormalExperimentDesign";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import {
  createArchitectureV2FormalScenario,
} from "../scenario/architectureV2FormalScenario";

import type {
  ArchitectureV2FormalScenarioMetadata,
} from "../scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  HeadlessSimulationResult,
} from "../types/headlessSimulation";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

export interface ArchitectureV2DemoReplayRequest {
  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly conditionId:
    ArchitectureV2ResearchDisruptionConditionId;

  readonly strategyId:
    RoutingStrategyId;

  readonly replicationSeed?:
    number;
}

export interface ArchitectureV2DemoReplayMetadata
  extends ArchitectureV2FormalScenarioMetadata {
  readonly strategyId:
    RoutingStrategyId;
}

export interface ArchitectureV2DemoReplay {
  readonly frames:
    readonly SimulationReplayFrame[];

  readonly result:
    HeadlessSimulationResult;

  readonly metadata:
    ArchitectureV2DemoReplayMetadata;
}

const DEFAULT_DEMO_SEED =
  ARCHITECTURE_V2_FORMAL_INITIAL_SEED_BANK[
    0
  ] ?? 100001;

export const DEFAULT_ARCHITECTURE_V2_DEMO_REQUEST:
  ArchitectureV2DemoReplayRequest =
Object.freeze({
  populationLevel:
    "MEDIUM",

  conditionId:
    "D0_BASELINE",

  strategyId:
    "ADAPTIVE_HYBRID",

  replicationSeed:
    DEFAULT_DEMO_SEED,
});

/**
 * Creates one authoritative replay directly from the
 * frozen Architecture V2.1 research model.
 *
 * The replay uses the same:
 *
 * - formal population model
 * - stochastic walking-speed model
 * - frozen disruption schedule
 * - condition-specific environment and graph
 * - movement model
 * - routing strategy implementation
 *
 * used by the formal experiment.
 *
 * This is still one simulation realization. It must not
 * be interpreted as the 40-replication formal result.
 */
export function createArchitectureV2DemoReplay(
  request:
    ArchitectureV2DemoReplayRequest =
      DEFAULT_ARCHITECTURE_V2_DEMO_REQUEST,
): ArchitectureV2DemoReplay {
  const replicationSeed =
    request.replicationSeed ??
    DEFAULT_DEMO_SEED;

  const bundle =
    createArchitectureV2FormalScenario({
      populationLevel:
        request.populationLevel,

      conditionId:
        request.conditionId,

      replicationSeed,
    });

  const frames:
    SimulationReplayFrame[] =
  [];

  const result =
    runHeadlessSimulation({
      scenario:
        bundle.scenario,

      environment:
        bundle.environment,

      graph:
        bundle.graph,

      exits:
        bundle.exits,

      spawnZones:
        bundle.spawnZones,

      configuration: {
        strategyId:
          request.strategyId,

        timestepSeconds:
          ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

        maximumSimulationTimeSeconds:
          180,

        densityCellLengthMeters:
          ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

        specificFlowPersonsPerMeterSecond:
          ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

        adaptiveRerouteThreshold:
          ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
      },

      replayIntervalSeconds:
        0.10,

      replayObserver:
        (
          frame,
        ) => {
          frames.push(
            frame,
          );
        },
    });

  if (
    frames.length ===
    0
  ) {
    throw new Error(
      "Architecture V2 demo replay produced no frames.",
    );
  }

  return Object.freeze({
    frames:
      Object.freeze([
        ...frames,
      ]),

    result,

    metadata:
      Object.freeze({
        ...bundle.metadata,

        strategyId:
          request.strategyId,
      }),
  });
}