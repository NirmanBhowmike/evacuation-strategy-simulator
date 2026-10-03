import {
  runHeadlessSimulation,
} from "../core/runHeadlessSimulation";

import {
  layoutA,
} from "../environment/layoutA";

import {
  layoutAExits,
} from "../environment/layoutAExits";

import {
  layoutANavigationGraph,
} from "../environment/layoutANavigationGraph";

import {
  layoutASpawnZones,
} from "../environment/layoutASpawnZones";

import {
  getResearchDisruptionCondition,
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_OCCUPANCY,
  RESEARCH_PARAMETER_SET_VERSION,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
} from "../scenario/researchParameterSet";

import type {
  HeadlessSimulationResult,
} from "../types/headlessSimulation";

import type {
  Position2D,
  ScenarioInstance,
} from "../types/scenario";

import type {
  SimulationReplayFrame,
} from "../types/simulationReplay";

import type {
  SpawnZone,
} from "../types/spawn";

export interface BaselineDemoReplay {
  readonly frames:
    readonly SimulationReplayFrame[];

  readonly result:
    HeadlessSimulationResult;
}

function polygonCenter(
  zone:
    SpawnZone,
): Position2D {
  const vertices =
    zone.polygon.vertices;

  if (
    vertices.length ===
    0
  ) {
    throw new Error(
      `Spawn zone ${zone.id} has no vertices.`,
    );
  }

  const total =
    vertices.reduce(
      (
        accumulator,
        vertex,
      ) => ({
        x:
          accumulator.x +
          vertex.x,

        y:
          accumulator.y +
          vertex.y,
      }),
      {
        x:
          0,

        y:
          0,
      },
    );

  return {
    x:
      total.x /
      vertices.length,

    y:
      total.y /
      vertices.length,
  };
}

function createBaselineScenario():
  ScenarioInstance {
  const spawnZones =
    layoutASpawnZones.zones;

  if (
    spawnZones.length ===
    0
  ) {
    throw new Error(
      "Layout A requires at least one spawn zone.",
    );
  }

  const baselineCondition =
    getResearchDisruptionCondition(
      "D0_BASELINE",
    );

  return {
    id:
      "layout-a-medium-d0-adaptive-demo",

    seed:
      1042,

    layoutId:
      layoutA.layoutId,

    parameterSetVersion:
      RESEARCH_PARAMETER_SET_VERSION,

    occupants:
      Array.from(
        {
          length:
            RESEARCH_OCCUPANCY
              .MEDIUM,
        },
        (
          _,
          index,
        ) => {
          const spawnZone =
            spawnZones[
              index %
              spawnZones.length
            ];

          if (!spawnZone) {
            throw new Error(
              "Unable to select a Layout A spawn zone.",
            );
          }

          return {
            id:
              `agent-${String(
                index + 1,
              ).padStart(
                4,
                "0",
              )}`,

            spawnPosition:
              polygonCenter(
                spawnZone,
              ),

            /**
             * The first live visualization deliberately
             * reproduces the calibrated occupancy baseline:
             * fixed free-flow speed of 1.34 m/s.
             *
             * This keeps the visual baseline directly
             * comparable with the occupancy calibration.
             */
            desiredSpeedMps:
              1.34,
          };
        },
      ),

    disruptionSchedule:
      baselineCondition.events,
  };
}

export function createBaselineDemoReplay():
  BaselineDemoReplay {
  const frames:
    SimulationReplayFrame[] =
    [];

  const result =
    runHeadlessSimulation({
      scenario:
        createBaselineScenario(),

      environment:
        layoutA,

      graph:
        layoutANavigationGraph,

      exits:
        layoutAExits,

      spawnZones:
        layoutASpawnZones,

      configuration: {
        strategyId:
          "ADAPTIVE_HYBRID",

        timestepSeconds:
          RESEARCH_TIMESTEP_SECONDS,

        maximumSimulationTimeSeconds:
          180,

        densityCellLengthMeters:
          RESEARCH_DENSITY_CELL_LENGTH_METERS,

        specificFlowPersonsPerMeterSecond:
          RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

        adaptiveRerouteThreshold:
          RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
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
      "Baseline replay produced no frames.",
    );
  }

  return Object.freeze({
    frames:
      Object.freeze([
        ...frames,
      ]),

    result,
  });
}