import {
  runHeadlessSimulation,
} from "../core/runHeadlessSimulation";

import type {
  ArchitectureV2FormalPopulationLevel,
} from "../population/architectureV2FormalPopulation";

import {
  createArchitectureV2FormalScenario,
} from "../scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../scenario/architectureV2ResearchParameterSet";

import type {
  HeadlessSimulationResult,
} from "../types/headlessSimulation";

import type {
  RoutingStrategyId,
} from "../types/routingStrategy";

import type {
  DisruptionEvent,
  ScenarioInstance,
} from "../types/scenario";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import {
  canAddInteractiveDemoEvent,
  INTERACTIVE_DEMO_NOTICE,
  sortInteractiveDemoEvents,
} from "./interactiveDemoMode";

import type {
  InteractiveDemoManualEvent,
} from "./interactiveDemoMode";

import {
  createInteractiveDemoArchitectureV2Environment,
  createInteractiveDemoArchitectureV2NavigationGraph,
} from "./interactiveDemoResearchModel";

export interface InteractiveDemoReplayRequest {
  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly strategyId:
    RoutingStrategyId;

  readonly replicationSeed:
    number;

  readonly events:
    readonly InteractiveDemoManualEvent[];
}

export interface InteractiveDemoReplayMetadata {
  readonly mode:
    "INTERACTIVE_DEMO";

  readonly notice:
    string;

  readonly scenarioId:
    string;

  readonly populationLevel:
    ArchitectureV2FormalPopulationLevel;

  readonly population:
    number;

  readonly strategyId:
    RoutingStrategyId;

  readonly replicationSeed:
    number;

  readonly spatialBaseSeed:
    number;

  readonly parameterSetVersion:
    string;

  readonly speedAssignmentVersion:
    string;

  readonly eventCount:
    number;

  readonly events:
    readonly InteractiveDemoManualEvent[];
}

export interface InteractiveDemoReplay {
  readonly frames:
    readonly SimulationReplayFrame[];

  readonly result:
    HeadlessSimulationResult;

  readonly metadata:
    InteractiveDemoReplayMetadata;
}

const INTERACTIVE_DEMO_REPLAY_INTERVAL_SECONDS =
  0.10;

const INTERACTIVE_DEMO_MAXIMUM_SIMULATION_TIME_SECONDS =
  180;

function validateInteractiveDemoEvents(
  events:
    readonly InteractiveDemoManualEvent[],
): void {
  const accepted:
    InteractiveDemoManualEvent[] =
  [];

  for (
    const event of
      events
  ) {
    if (
      !canAddInteractiveDemoEvent(
        accepted,
        event.type,
        event.targetId,
        event.activationTimeSeconds,
      )
    ) {
      throw new Error(
        `Invalid or duplicate Interactive Demo event: ${event.type} / ${event.targetId} / ${event.activationTimeSeconds}.`,
      );
    }

    accepted.push(
      event,
    );
  }
}

function createScenarioId(
  populationLevel:
    ArchitectureV2FormalPopulationLevel,

  replicationSeed:
    number,

  events:
    readonly InteractiveDemoManualEvent[],
): string {
  const eventToken =
    events.length ===
      0
      ? "no-events"
      : events
          .map(
            (
              event,
            ) =>
              event.eventId,
          )
          .join(
            "--",
          );

  return [
    "layout-a-v2",
    "interactive-demo",
    populationLevel.toLowerCase(),
    `seed-${replicationSeed}`,
    eventToken,
  ].join(
    "-",
  );
}

function createDisruptionSchedule(
  events:
    readonly InteractiveDemoManualEvent[],
): readonly DisruptionEvent[] {
  return events.map(
    (
      event,
    ) => ({
      id:
        event.eventId,

      type:
        event.type,

      targetId:
        event.targetId,

      activationTimeSeconds:
        event.activationTimeSeconds,
    }),
  );
}

export function createInteractiveDemoReplay(
  request:
    InteractiveDemoReplayRequest,
): InteractiveDemoReplay {
  if (
    !Number.isInteger(
      request.replicationSeed,
    )
  ) {
    throw new Error(
      "Interactive Demo replication seed must be an integer.",
    );
  }

  validateInteractiveDemoEvents(
    request.events,
  );

  const events =
    sortInteractiveDemoEvents(
      request.events,
    );

  /*
   * D0 is used only as the validated stochastic population
   * and spatial base. Its formal disruption schedule is empty.
   *
   * Interactive Demo events are substituted below and are
   * never represented as a formal research condition.
   */
  const base =
    createArchitectureV2FormalScenario({
      populationLevel:
        request.populationLevel,

      conditionId:
        "D0_BASELINE",

      replicationSeed:
        request.replicationSeed,
    });

  if (
    base.scenario
      .disruptionSchedule
      .length !==
    0
  ) {
    throw new Error(
      "Interactive Demo requires an undisrupted D0 base scenario.",
    );
  }

  const scenarioId =
    createScenarioId(
      request.populationLevel,
      request.replicationSeed,
      events,
    );

  const scenario:
    ScenarioInstance = {
    ...base.scenario,

    id:
      scenarioId,

    disruptionSchedule:
      createDisruptionSchedule(
        events,
      ),
  };

  const environment =
    createInteractiveDemoArchitectureV2Environment(
      events,
    );

  const graph =
    createInteractiveDemoArchitectureV2NavigationGraph(
      base.graph,
      events,
    );

  if (
    environment.layoutId !==
    scenario.layoutId
  ) {
    throw new Error(
      `Interactive Demo environment layout mismatch: scenario=${scenario.layoutId}, environment=${environment.layoutId}.`,
    );
  }

  if (
    graph.layoutId !==
    scenario.layoutId
  ) {
    throw new Error(
      `Interactive Demo graph layout mismatch: scenario=${scenario.layoutId}, graph=${graph.layoutId}.`,
    );
  }

  const frames:
    SimulationReplayFrame[] =
  [];

  const result =
    runHeadlessSimulation({
      scenario,

      environment,

      graph,

      exits:
        base.exits,

      spawnZones:
        base.spawnZones,

      configuration: {
        strategyId:
          request.strategyId,

        timestepSeconds:
          ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

        maximumSimulationTimeSeconds:
          INTERACTIVE_DEMO_MAXIMUM_SIMULATION_TIME_SECONDS,

        densityCellLengthMeters:
          ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

        specificFlowPersonsPerMeterSecond:
          ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

        adaptiveRerouteThreshold:
          ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
      },

      replayIntervalSeconds:
        INTERACTIVE_DEMO_REPLAY_INTERVAL_SECONDS,

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
      "Interactive Demo replay produced no frames.",
    );
  }

  const metadata:
    InteractiveDemoReplayMetadata =
  Object.freeze({
    mode:
      "INTERACTIVE_DEMO",

    notice:
      INTERACTIVE_DEMO_NOTICE,

    scenarioId,

    populationLevel:
      request.populationLevel,

    population:
      base.metadata.population,

    strategyId:
      request.strategyId,

    replicationSeed:
      request.replicationSeed,

    spatialBaseSeed:
      base.metadata.spatialBaseSeed,

    parameterSetVersion:
      base.metadata.parameterSetVersion,

    speedAssignmentVersion:
      base.metadata.speedAssignmentVersion,

    eventCount:
      events.length,

    events,
  });

  return Object.freeze({
    frames:
      Object.freeze([
        ...frames,
      ]),

    result,

    metadata,
  });
}