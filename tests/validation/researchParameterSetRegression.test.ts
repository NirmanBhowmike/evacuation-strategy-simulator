import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import {
  layoutA,
} from "../../src/environment/layoutA";
import {
  layoutAExits,
} from "../../src/environment/layoutAExits";
import {
  layoutANavigationGraph,
} from "../../src/environment/layoutANavigationGraph";
import {
  layoutASpawnZones,
} from "../../src/environment/layoutASpawnZones";

import {
  getResearchDisruptionCondition,
  RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  RESEARCH_DENSITY_CELL_LENGTH_METERS,
  RESEARCH_DISRUPTION_CONDITIONS,
  RESEARCH_OCCUPANCY,
  RESEARCH_PARAMETER_SET_VERSION,
  RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  RESEARCH_TIMESTEP_SECONDS,
} from "../../src/scenario/researchParameterSet";

import type {
  Position2D,
  ScenarioInstance,
} from "../../src/types/scenario";
import type {
  RoutingStrategyId,
} from "../../src/types/routingStrategy";
import type {
  SpawnZone,
} from "../../src/types/spawn";

const STRATEGIES:
  readonly RoutingStrategyId[] =
[
  "NEAREST_EXIT",
  "STATIC_SHORTEST_PATH",
  "CONGESTION_AWARE",
  "HAZARD_AWARE",
  "ADAPTIVE_HYBRID",
];

function polygonCenter(
  zone: SpawnZone,
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

  const sum =
    vertices.reduce(
      (
        total,
        vertex,
      ) => ({
        x:
          total.x +
          vertex.x,

        y:
          total.y +
          vertex.y,
      }),
      {
        x: 0,
        y: 0,
      },
    );

  return {
    x:
      sum.x /
      vertices.length,

    y:
      sum.y /
      vertices.length,
  };
}

function createScenario(
  conditionId:
    Parameters<
      typeof getResearchDisruptionCondition
    >[0],
  strategyId:
    RoutingStrategyId,
): ScenarioInstance {
  const condition =
    getResearchDisruptionCondition(
      conditionId,
    );

  return {
    id:
      `${conditionId}-${strategyId}-regression`,

    seed:
      1042,

    layoutId:
      "layout-a",

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
            layoutASpawnZones
              .zones[
                index %
                layoutASpawnZones
                  .zones
                  .length
              ];

          if (!spawnZone) {
            throw new Error(
              "Unable to select Layout A spawn zone.",
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

            desiredSpeedMps:
              1.34,
          };
        },
      ),

    disruptionSchedule:
      condition.events,
  };
}

function runCase(
  conditionId:
    Parameters<
      typeof getResearchDisruptionCondition
    >[0],
  strategyId:
    RoutingStrategyId,
) {
  return runHeadlessSimulation({
    scenario:
      createScenario(
        conditionId,
        strategyId,
      ),

    environment:
      layoutA,

    graph:
      layoutANavigationGraph,

    exits:
      layoutAExits,

    spawnZones:
      layoutASpawnZones,

    configuration: {
      strategyId,

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
  });
}

describe(
  "Frozen Research Model v1.0 parameter set",
  () => {
    it("contains the calibrated numerical and factorial parameters", () => {
      expect(
        RESEARCH_TIMESTEP_SECONDS,
      ).toBe(
        0.05,
      );

      expect(
        RESEARCH_DENSITY_CELL_LENGTH_METERS,
      ).toBe(
        1,
      );

      expect(
        RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
      ).toBe(
        1.3,
      );

      expect(
        RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
      ).toBe(
        0.10,
      );

      expect(
        RESEARCH_OCCUPANCY,
      ).toEqual({
        LOW:
          12,

        MEDIUM:
          36,

        HIGH:
          48,
      });

      expect(
        RESEARCH_DISRUPTION_CONDITIONS,
      ).toHaveLength(
        5,
      );
    });

    it("reproduces the selected hazard-response signature", () => {
      for (
        const strategyId of
          STRATEGIES
      ) {
        const result =
          runCase(
            "D1_HAZARD",
            strategyId,
          );

        expect(
          result.metrics
            .completionRate,
        ).toBe(1);

        expect(
          result.metrics
            .unreachableAgents,
        ).toBe(0);

        expect(
          result.metrics
            .timeoutAgents,
        ).toBe(0);

        if (
          strategyId ===
            "HAZARD_AWARE" ||
          strategyId ===
            "ADAPTIVE_HYBRID"
        ) {
          expect(
            result.metrics
              .totalEvacuationTimeSeconds,
          ).toBeCloseTo(
            64.75,
            8,
          );

          expect(
            result.metrics
              .populationHazardExposurePersonSeconds,
          ).toBeCloseTo(
            21.86,
            2,
          );
        } else {
          expect(
            result.metrics
              .totalEvacuationTimeSeconds,
          ).toBeCloseTo(
            26.5,
            8,
          );

          expect(
            result.metrics
              .populationHazardExposurePersonSeconds,
          ).toBeCloseTo(
            31.97,
            2,
          );
        }
      }
    });

    it("reproduces the selected exit-block and combined signatures", () => {
      for (
        const strategyId of
          STRATEGIES
      ) {
        const exitResult =
          runCase(
            "D2_EXIT_BLOCK",
            strategyId,
          );

        expect(
          exitResult.metrics
            .completionRate,
        ).toBe(1);

        expect(
          exitResult.metrics
            .totalEvacuationTimeSeconds,
        ).toBeCloseTo(
          44.55,
          8,
        );

        expect(
          exitResult.routeStability
            .totalRouteReversalEvents,
        ).toBe(2);

        expect(
          exitResult.metrics
            .unreachableAgents,
        ).toBe(0);

        expect(
          exitResult.metrics
            .timeoutAgents,
        ).toBe(0);

        const combinedResult =
          runCase(
            "D4_COMBINED",
            strategyId,
          );

        expect(
          combinedResult.metrics
            .completionRate,
        ).toBe(1);

        expect(
          combinedResult.metrics
            .unreachableAgents,
        ).toBe(0);

        expect(
          combinedResult.metrics
            .timeoutAgents,
        ).toBe(0);

        if (
          strategyId ===
            "HAZARD_AWARE" ||
          strategyId ===
            "ADAPTIVE_HYBRID"
        ) {
          expect(
            combinedResult.metrics
              .totalEvacuationTimeSeconds,
          ).toBeCloseTo(
            64.75,
            8,
          );

          expect(
            combinedResult.metrics
              .populationHazardExposurePersonSeconds,
          ).toBeCloseTo(
            21.86,
            2,
          );
        } else {
          expect(
            combinedResult.metrics
              .totalEvacuationTimeSeconds,
          ).toBeCloseTo(
            44.55,
            8,
          );

          expect(
            combinedResult.metrics
              .populationHazardExposurePersonSeconds,
          ).toBeCloseTo(
            60.73,
            2,
          );
        }
      }
    });
  },
);