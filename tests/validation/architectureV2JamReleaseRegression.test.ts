import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runHeadlessSimulation,
} from "../../src/core/runHeadlessSimulation";

import {
  WEIDMANN_JAM_DENSITY_PPM2,
} from "../../src/core/congestionEffects";

import {
  ARCHITECTURE_V2_FORMAL_STRATEGY_IDS,
} from "../../src/experiment/architectureV2FormalExperimentDesign";

import {
  createArchitectureV2FormalScenario,
} from "../../src/scenario/architectureV2FormalScenario";

import {
  ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
  ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,
  ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
  ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,
  ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import type {
  ArchitectureV2ResearchDisruptionConditionId,
} from "../../src/scenario/architectureV2ResearchParameterSet";

import type {
  RoutingStrategyId,
} from "../../src/types/routingStrategy";

function runCase(
  conditionId:
    ArchitectureV2ResearchDisruptionConditionId,
  strategyId:
    RoutingStrategyId,
  maximumSimulationTimeSeconds:
    number,
) {
  const bundle =
    createArchitectureV2FormalScenario({
      populationLevel:
        "HIGH",

      conditionId,

      replicationSeed:
        100025,
    });

  return runHeadlessSimulation({
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
      strategyId,

      timestepSeconds:
        ARCHITECTURE_V2_RESEARCH_TIMESTEP_SECONDS,

      maximumSimulationTimeSeconds,

      densityCellLengthMeters:
        ARCHITECTURE_V2_RESEARCH_DENSITY_CELL_LENGTH_METERS,

      specificFlowPersonsPerMeterSecond:
        ARCHITECTURE_V2_RESEARCH_SPECIFIC_FLOW_PERSONS_PER_METER_SECOND,

      adaptiveRerouteThreshold:
        ARCHITECTURE_V2_RESEARCH_ADAPTIVE_REROUTE_THRESHOLD,
    },
  });
}

describe(
  "Architecture V2 jam-release regression",
  () => {
    it(
      "uses the corrected Architecture V2 parameter-set version",
      () => {
        expect(
          ARCHITECTURE_V2_RESEARCH_PARAMETER_SET_VERSION,
        ).toBe(
          "architecture-v2-research-v1.2-frozen",
        );
      },
    );

    it(
      "resolves the formerly absorbing HIGH seed 100025 D0 and D1 cases by 300 seconds",
      () => {
        const conditions:
          readonly ArchitectureV2ResearchDisruptionConditionId[] =
        [
          "D0_BASELINE",
          "D1_HAZARD",
        ];

        for (
          const conditionId of
            conditions
        ) {
          for (
            const strategyId of
              ARCHITECTURE_V2_FORMAL_STRATEGY_IDS
          ) {
            const result =
              runCase(
                conditionId,
                strategyId,
                300,
              );

            expect(
              result.termination.reason,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              "ALL_RESOLVED",
            );

            expect(
              result.metrics
                .completionRate,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              1,
            );

            expect(
              result.metrics
                .evacuatedAgents,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              70,
            );

            expect(
              result.metrics
                .timeoutAgents,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              0,
            );

            expect(
              result.metrics
                .unreachableAgents,
              `${conditionId} / ${strategyId}`,
            ).toBe(
              0,
            );
          }
        }
      },
      30000,
    );

    it(
      "preserves normal completion when observed density remains below the jam threshold",
      () => {
        const bundle =
          createArchitectureV2FormalScenario({
            populationLevel:
              "MEDIUM",

            conditionId:
              "D0_BASELINE",

            replicationSeed:
              100001,
          });

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
                "ADAPTIVE_HYBRID",

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
          });

        expect(
          result.termination.reason,
        ).toBe(
          "ALL_RESOLVED",
        );

        expect(
          result.metrics
            .completionRate,
        ).toBe(
          1,
        );

        expect(
          result.metrics
            .maximumLocalDensityPersonsPerSquareMeter,
        ).not.toBeNull();

        expect(
          result.metrics
            .maximumLocalDensityPersonsPerSquareMeter!,
        ).toBeLessThan(
          WEIDMANN_JAM_DENSITY_PPM2,
        );
      },
    );
  },
);